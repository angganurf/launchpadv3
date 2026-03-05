

## Fix Chart Flickering, Candle Width, and Data Positioning

### Problems Identified

1. **Chart recreates on every data update** — The `useEffect` includes `bars` in its dependency array, causing the entire chart to be destroyed and rebuilt every 5 seconds (the refetch interval). This causes visible flickering instead of smooth updates.

2. **Candlesticks too fat** — `barSpacing: 12` (normal) and `28` (sparse) are too wide. Should be smaller for a professional look.

3. **Data anchored to left instead of right** — `chart.timeScale().fitContent()` stretches all bars across the full width. For a trading chart, the latest candles should be anchored to the right edge with empty space on the left.

### Changes — `src/components/launchpad/CodexChart.tsx`

**Split into two effects:**

1. **Chart creation effect** — depends on `height`, `isFullscreen`, `showVolume`, `resolution` only (NOT `bars`). Creates the chart once and stores series refs.

2. **Data update effect** — depends on `bars`, `showVolume`. Calls `setData()` on existing series refs without destroying the chart. Scrolls to the right edge after update.

**Specific fixes:**
- Remove `bars` from the chart creation effect dependencies
- Store `candleSeries` and `volumeSeries` in refs
- Add a separate effect that calls `.setData()` and `.createPriceLine()` when `bars` changes
- Reduce `barSpacing` from `12` → `6` for normal data, `28` → `14` for sparse
- Reduce `minBarSpacing` from `4` → `2`
- Replace `fitContent()` with `scrollToPosition(rightOffset, false)` to keep latest candles on the right
- For sparse data, use a logical range that anchors data to the right portion of the chart

