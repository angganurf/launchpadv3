ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS privy_wallet_id TEXT,
ADD COLUMN IF NOT EXISTS privy_did TEXT;