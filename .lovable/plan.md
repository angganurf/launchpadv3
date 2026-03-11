

## Add Scroll Arrows to King of the Hill (Mobile)

Show left/right chevron arrows flanking the KOTH cards container on mobile to indicate horizontal scrollability.

### Changes — single file: `src/components/launchpad/KingOfTheHill.tsx`

1. **Import `ChevronLeft`, `ChevronRight`** from lucide-react
2. **Add a `useRef` + scroll state** to track whether the user can scroll left/right
3. **Wrap the cards row** in a `relative` container with two arrow buttons:
   - Left arrow: positioned `absolute left-0` vertically centered, semi-transparent dark bg, only visible when scrolled right
   - Right arrow: positioned `absolute right-0`, only visible when more content is to the right
   - Both hidden on `md:` screens (desktop shows all cards)
4. **onClick handlers** scroll the container by one card width (~290px) smoothly
5. **onScroll listener** updates left/right visibility state

Visual: `‹  [Card]  ›` — subtle circular buttons with chevrons, overlaid on the edges of the scroll container.

