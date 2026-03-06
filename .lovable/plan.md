

## Fix: Background Sparkline Chart Not Visible on Token Cards

### Problem
The `SparklineCanvas` component has **conflicting sizing**: it sets `style={{ width: 300, height: 40 }}` as inline styles, which override the `className="absolute inset-0 w-full h-full"`. Result: the canvas renders as a tiny 300×40 box in the top-left corner of the card instead of filling the entire card background.

Additionally, the canvas draws at a fixed 300×40 resolution regardless of actual card size, making it invisible or misaligned.

### Fix (1 file)

**`src/components/launchpad/SparklineCanvas.tsx`**

- Remove the fixed `width`/`height` props and inline `style`
- Use a `ResizeObserver` (or parent `getBoundingClientRect`) to dynamically measure the actual card dimensions and draw the canvas at full size
- Keep `absolute inset-0 w-full h-full pointer-events-none z-0` for positioning
- Increase fill opacity slightly (like Azura's dimmed look — `0.08` → `0.15` for the top gradient stop) so the chart is subtly visible behind card content

```tsx
// Remove: style={{ width, height }}
// Add: ref-based measurement of parent size
// Canvas element: just className, no inline style
<canvas
  ref={canvasRef}
  className="absolute inset-0 w-full h-full pointer-events-none z-0"
/>
```

The `useEffect` will read `canvas.clientWidth` and `canvas.clientHeight` to set the drawing resolution dynamically, then draw the sparkline across the full card area.

### Why it wasn't working
Inline `style={{ width: 300, height: 40 }}` has higher CSS specificity than Tailwind's `w-full h-full`, so the canvas was constrained to 300×40px — a small strip mostly hidden under card content.

