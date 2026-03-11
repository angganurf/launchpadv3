// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TunaPortal
 * @notice Factory + bonding curve AMM for BNB Chain token launches.
 *         Deploys ERC20 tokens via CREATE2, manages constant-product bonding curve,
 *         and graduates to PancakeSwap V3 when threshold is met.
 *
 * Lifecycle:
 *   1. Creator calls newToken() → deploys ERC20, mints 1B to Portal
 *   2. Users buy/sell against the bonding curve (1% fee)
 *   3. At ~16 BNB real reserves, graduates to PancakeSwap V3
 */

// ============================================================================
// Minimal ERC20 (deployed via CREATE2)
// ============================================================================
contract TunaToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory _name, string memory _symbol, address _recipient, uint256 _supply) {
        name = _name;
        symbol = _symbol;
        totalSupply = _supply;
        balanceOf[_recipient] = _supply;
        emit Transfer(address(0), _recipient, _supply);
    }

    function transfer(address _to, uint256 _value) public returns (bool) {
        require(balanceOf[msg.sender] >= _value, "ERC20: insufficient balance");
        unchecked {
            balanceOf[msg.sender] -= _value;
            balanceOf[_to] += _value;
        }
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) public returns (bool) {
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
        require(balanceOf[_from] >= _value, "ERC20: insufficient balance");
        require(allowance[_from][msg.sender] >= _value, "ERC20: insufficient allowance");
        unchecked {
            allowance[_from][msg.sender] -= _value;
            balanceOf[_from] -= _value;
            balanceOf[_to] += _value;
        }
        emit Transfer(_from, _to, _value);
        return true;
    }
}

// ============================================================================
// TunaPortal — Factory + Bonding Curve AMM
// ============================================================================
contract TunaPortal {
    // ── Constants ──────────────────────────────────────────────────────
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 1e18; // 1B tokens
    uint256 public constant BONDING_TOKENS = 800_000_000 * 1e18;  // 800M sold via curve
    uint256 public constant LP_TOKENS = 200_000_000 * 1e18;       // 200M reserved for LP

    // Virtual reserves for constant-product curve (matching Flap parameters)
    uint256 public constant VIRTUAL_BNB = 6_140_000_000_000_000_000; // 6.14 BNB in wei
    uint256 public constant VIRTUAL_TOKENS = 107_036_752 * 1e18;     // 107M tokens

    // Graduation threshold: ~16 BNB real reserves
    uint256 public constant GRADUATION_THRESHOLD = 16 ether;

    // Trading fee: 1% (100 bps)
    uint256 public constant TRADING_FEE_BPS = 100;
    uint256 public constant BPS_DENOMINATOR = 10_000;

    // PancakeSwap V3 NonfungiblePositionManager on BSC
    address public constant PANCAKE_V3_POSITION_MANAGER = 0x46A15B0b27311cedF172AB29E4f4766fbE7F4364;
    // PancakeSwap V3 Factory on BSC
    address public constant PANCAKE_V3_FACTORY = 0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865;
    // WBNB
    address public constant WBNB = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;

    // ── State ──────────────────────────────────────────────────────────
    address public owner;
    address public platformWallet;

    struct TokenInfo {
        address creator;
        uint256 creatorFeeBps;      // Creator's share of the 1% fee (0-10000)
        uint256 virtualBnb;         // Virtual BNB reserve
        uint256 virtualTokens;      // Virtual token reserve
        uint256 realBnb;            // Real BNB collected
        uint256 realTokens;         // Real tokens remaining in curve
        uint256 totalFeesCollected;
        uint256 creatorFeesClaimed;
        bool graduated;
        string metadataUri;         // IPFS or URL for off-chain metadata
    }

    mapping(address => TokenInfo) public tokens;
    address[] public allTokens;

    // ── Events ─────────────────────────────────────────────────────────
    event TokenCreated(
        address indexed token,
        address indexed creator,
        string name,
        string symbol,
        uint256 creatorFeeBps,
        string metadataUri
    );

    event Trade(
        address indexed token,
        address indexed trader,
        bool isBuy,
        uint256 bnbAmount,
        uint256 tokenAmount,
        uint256 fee,
        uint256 newPrice,
        uint256 realBnbReserves,
        uint256 bondingProgress
    );

    event Graduated(
        address indexed token,
        address indexed v3Pool,
        uint256 bnbLiquidity,
        uint256 tokenLiquidity
    );

    event FeesClaimed(
        address indexed token,
        address indexed creator,
        uint256 amount
    );

    // ── Modifiers ──────────────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ── Constructor ────────────────────────────────────────────────────
    constructor(address _platformWallet) {
        owner = msg.sender;
        platformWallet = _platformWallet;
    }

    // ── Token Creation ─────────────────────────────────────────────────
    /**
     * @notice Deploy a new token with bonding curve.
     * @param _name Token name
     * @param _symbol Token symbol
     * @param _creatorFeeBps Creator's share of the 1% trading fee (0-10000 = 0-100%)
     * @param _metadataUri Off-chain metadata URI (IPFS CID or URL)
     * @param _salt CREATE2 salt for vanity address
     */
    function newToken(
        string calldata _name,
        string calldata _symbol,
        uint256 _creatorFeeBps,
        string calldata _metadataUri,
        bytes32 _salt
    ) external payable returns (address tokenAddress) {
        require(_creatorFeeBps <= BPS_DENOMINATOR, "Fee > 100%");

        // Deploy ERC20 via CREATE2 — all tokens minted to this Portal
        bytes memory bytecode = abi.encodePacked(
            type(TunaToken).creationCode,
            abi.encode(_name, _symbol, address(this), TOTAL_SUPPLY)
        );

        assembly {
            tokenAddress := create2(0, add(bytecode, 0x20), mload(bytecode), _salt)
            if iszero(tokenAddress) { revert(0, 0) }
        }

        // Initialize bonding curve
        tokens[tokenAddress] = TokenInfo({
            creator: msg.sender,
            creatorFeeBps: _creatorFeeBps,
            virtualBnb: VIRTUAL_BNB,
            virtualTokens: VIRTUAL_TOKENS,
            realBnb: 0,
            realTokens: BONDING_TOKENS,
            totalFeesCollected: 0,
            creatorFeesClaimed: 0,
            graduated: false,
            metadataUri: _metadataUri
        });

        allTokens.push(tokenAddress);

        emit TokenCreated(tokenAddress, msg.sender, _name, _symbol, _creatorFeeBps, _metadataUri);

        // If msg.value > 0, execute initial buy for the creator
        if (msg.value > 0) {
            _buy(tokenAddress, msg.sender);
        }

        return tokenAddress;
    }

    // ── Buy (BNB → Tokens) ────────────────────────────────────────────
    function buy(address _token) external payable {
        _buy(_token, msg.sender);
    }

    function _buy(address _token, address _recipient) internal {
        TokenInfo storage info = tokens[_token];
        require(info.creator != address(0), "Token not found");
        require(!info.graduated, "Token graduated — trade on PancakeSwap");
        require(msg.value > 0, "No BNB sent");

        // Deduct fee
        uint256 fee = (msg.value * TRADING_FEE_BPS) / BPS_DENOMINATOR;
        uint256 bnbIn = msg.value - fee;

        // Constant product: tokensOut = realTokens - K / (virtualBnb + virtualTokens_adjusted)
        // Simplified: tokensOut = (bnbIn * virtualTokens) / (virtualBnb + bnbIn)
        uint256 effectiveBnb = info.virtualBnb + info.realBnb;
        uint256 effectiveTokens = info.virtualTokens + info.realTokens;
        uint256 k = effectiveBnb * effectiveTokens;

        uint256 newEffectiveBnb = effectiveBnb + bnbIn;
        uint256 newEffectiveTokens = k / newEffectiveBnb;
        uint256 tokensOut = effectiveTokens - newEffectiveTokens;

        require(tokensOut > 0, "Insufficient output");
        require(tokensOut <= info.realTokens, "Exceeds available tokens");

        // Update state
        info.realBnb += bnbIn;
        info.realTokens -= tokensOut;
        info.totalFeesCollected += fee;

        // Distribute fee
        _distributeFee(info, fee);

        // Transfer tokens to buyer
        TunaToken(_token).transfer(_recipient, tokensOut);

        // Calculate current price and progress
        uint256 newPrice = _getPrice(info);
        uint256 progress = (info.realBnb * 10000) / GRADUATION_THRESHOLD;
        if (progress > 10000) progress = 10000;

        emit Trade(_token, _recipient, true, msg.value, tokensOut, fee, newPrice, info.realBnb, progress);

        // Check graduation
        if (info.realBnb >= GRADUATION_THRESHOLD) {
            _graduate(_token);
        }
    }

    // ── Sell (Tokens → BNB) ────────────────────────────────────────────
    function sell(address _token, uint256 _tokenAmount) external {
        TokenInfo storage info = tokens[_token];
        require(info.creator != address(0), "Token not found");
        require(!info.graduated, "Token graduated — trade on PancakeSwap");
        require(_tokenAmount > 0, "No tokens");

        // Transfer tokens from seller to Portal
        TunaToken(_token).transferFrom(msg.sender, address(this), _tokenAmount);

        // Constant product: bnbOut = realBnb - K / (virtualTokens + realTokens + tokensIn)
        uint256 effectiveBnb = info.virtualBnb + info.realBnb;
        uint256 effectiveTokens = info.virtualTokens + info.realTokens;
        uint256 k = effectiveBnb * effectiveTokens;

        uint256 newEffectiveTokens = effectiveTokens + _tokenAmount;
        uint256 newEffectiveBnb = k / newEffectiveTokens;
        uint256 bnbOut = effectiveBnb - newEffectiveBnb;

        require(bnbOut > 0, "Insufficient output");
        require(bnbOut <= info.realBnb, "Exceeds real reserves");

        // Deduct fee from output
        uint256 fee = (bnbOut * TRADING_FEE_BPS) / BPS_DENOMINATOR;
        uint256 bnbToSeller = bnbOut - fee;

        // Update state
        info.realBnb -= bnbOut;
        info.realTokens += _tokenAmount;
        info.totalFeesCollected += fee;

        // Distribute fee
        _distributeFee(info, fee);

        // Send BNB to seller
        (bool sent, ) = msg.sender.call{value: bnbToSeller}("");
        require(sent, "BNB transfer failed");

        // Calculate current price and progress
        uint256 newPrice = _getPrice(info);
        uint256 progress = (info.realBnb * 10000) / GRADUATION_THRESHOLD;
        if (progress > 10000) progress = 10000;

        emit Trade(_token, msg.sender, false, bnbOut, _tokenAmount, fee, newPrice, info.realBnb, progress);
    }

    // ── Graduation to PancakeSwap V3 ──────────────────────────────────
    function _graduate(address _token) internal {
        TokenInfo storage info = tokens[_token];
        info.graduated = true;

        uint256 bnbForLP = info.realBnb;
        uint256 tokensForLP = LP_TOKENS; // 200M reserved for LP

        // Approve PancakeSwap V3 Position Manager
        TunaToken(_token).approve(PANCAKE_V3_POSITION_MANAGER, tokensForLP);

        // Note: Full V3 position creation requires calling the NonfungiblePositionManager
        // with mint() — this is a simplified version. In production, wrap BNB to WBNB first,
        // then create the V3 pool and add concentrated liquidity.
        //
        // For the MVP, we transfer BNB + tokens to a designated graduation handler
        // or use PancakeSwap V2 as fallback.

        // For now: simple V2 fallback (can upgrade to V3 later)
        // Transfer remaining tokens + BNB to platform for manual LP creation
        // In production: automated V3 pool creation

        emit Graduated(_token, address(0), bnbForLP, tokensForLP);
    }

    // ── Fee Distribution ──────────────────────────────────────────────
    function _distributeFee(TokenInfo storage info, uint256 fee) internal {
        uint256 creatorShare = (fee * info.creatorFeeBps) / BPS_DENOMINATOR;
        uint256 platformShare = fee - creatorShare;

        // Platform fee sent immediately
        if (platformShare > 0) {
            (bool sent, ) = platformWallet.call{value: platformShare}("");
            // Don't revert on platform fee failure — just continue
            if (!sent) {
                // Platform fee stays in contract
            }
        }

        // Creator share accumulates (claimable via claimFees)
        // Already tracked in totalFeesCollected
    }

    function claimCreatorFees(address _token) external {
        TokenInfo storage info = tokens[_token];
        require(msg.sender == info.creator, "Not creator");

        uint256 totalCreatorFees = (info.totalFeesCollected * info.creatorFeeBps) / BPS_DENOMINATOR;
        uint256 claimable = totalCreatorFees - info.creatorFeesClaimed;
        require(claimable > 0, "Nothing to claim");

        info.creatorFeesClaimed += claimable;

        (bool sent, ) = msg.sender.call{value: claimable}("");
        require(sent, "Transfer failed");

        emit FeesClaimed(_token, msg.sender, claimable);
    }

    // ── View Functions ────────────────────────────────────────────────
    function _getPrice(TokenInfo storage info) internal view returns (uint256) {
        uint256 effectiveBnb = info.virtualBnb + info.realBnb;
        uint256 effectiveTokens = info.virtualTokens + info.realTokens;
        // Price = effectiveBnb / effectiveTokens (in wei per token-wei)
        // Multiply by 1e18 for precision
        return (effectiveBnb * 1e18) / effectiveTokens;
    }

    function getPrice(address _token) external view returns (uint256) {
        return _getPrice(tokens[_token]);
    }

    function getTokenInfo(address _token) external view returns (
        address creator,
        uint256 creatorFeeBps,
        uint256 realBnb,
        uint256 realTokens,
        uint256 bondingProgress,
        bool graduated,
        uint256 totalFeesCollected,
        uint256 price
    ) {
        TokenInfo storage info = tokens[_token];
        uint256 progress = (info.realBnb * 10000) / GRADUATION_THRESHOLD;
        if (progress > 10000) progress = 10000;

        return (
            info.creator,
            info.creatorFeeBps,
            info.realBnb,
            info.realTokens,
            progress,
            info.graduated,
            info.totalFeesCollected,
            _getPrice(info)
        );
    }

    function getTokenCount() external view returns (uint256) {
        return allTokens.length;
    }

    function predictTokenAddress(
        string calldata _name,
        string calldata _symbol,
        bytes32 _salt
    ) external view returns (address) {
        bytes memory bytecode = abi.encodePacked(
            type(TunaToken).creationCode,
            abi.encode(_name, _symbol, address(this), TOTAL_SUPPLY)
        );
        bytes32 hash = keccak256(abi.encodePacked(
            bytes1(0xff),
            address(this),
            _salt,
            keccak256(bytecode)
        ));
        return address(uint160(uint256(hash)));
    }

    // ── Admin ──────────────────────────────────────────────────────────
    function setPlatformWallet(address _wallet) external onlyOwner {
        platformWallet = _wallet;
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        owner = _newOwner;
    }

    // Receive BNB
    receive() external payable {}
}
