

## Honest Assessment: What Tools Are Needed

Since this is a **unique custom template** (no live URL), Firecrawl and similar web-scraping tools **cannot help** — there's nothing to scrape. The only input is the uploaded image.

Here's what **will** work:

### Tool #1: My Image Analysis (Already Available)
I can see the template image directly. From it I extract:
- **Background**: `#0d0d0f` (near-black)
- **Surface/cards**: `#1a1a1c`
- **Borders**: `#2a2a2c`
- **Primary accent**: `#c8ff00` (chartreuse)
- **Text primary**: `#e8e8e8`
- **Text secondary**: `#6b6b6b`
- **Positive**: `#00c076`, **Negative**: `#ff4d4d`
- **Font**: Monospace/technical (IBM Plex Mono or similar)
- **Sidebar**: ~48px, icon-only, vertical
- **Border radius**: Small (4-6px), not rounded

### Tool #2: Browser Screenshot Comparison (Already Available)
After each phase of changes, I use `browser--screenshot` to take a screenshot of the result and compare it visually against the template to catch mismatches in spacing, colors, or positioning.

### Tool #3 (Optional): If You Can Provide More
If you have access to the **Figma file**, **CSS source**, or **HTML source** of this template, paste it here and I can extract pixel-perfect values. Otherwise, the image is sufficient.

---

## Implementation Plan (5 Phases, ~30 files)

### Phase 1: Design System Overhaul
Update `src/index.css` CSS variables (`.dark` block) and `tailwind.config.ts`:
- Swap all color tokens to match template palette
- Switch font to `IBM Plex Mono` / monospace stack
- Update `btn-gradient-green` to chartreuse `#c8ff00`
- Update border-radius to smaller values (4-6px)
- Update shadow tokens

### Phase 2: Sidebar → 48px Icon-Only
- Rebuild `Sidebar.tsx`: remove labels, shrink to 48px, icon-only with chartreuse active indicator
- Update `LaunchpadLayout.tsx`: change offset from 160px to 48px
- Update `App.css` footer offset

### Phase 3: Header Restyle
- Restyle `AppHeader.tsx`: compact monospace, chartreuse accents, match template search bar and wallet display

### Phase 4: Trading Terminal & Token Cards
- Update chart colors, buy/sell panels, token cards to chartreuse/dark scheme
- Update all card components (`pf-card`, `lt-card`, `pulse-card`)

### Phase 5: All Remaining Pages & Polish
- Update landing (`ClawHero.tsx`), agents, console, whitepaper pages
- Update `claw-theme.css`, `gate-theme.css`, `clawbook-theme.css`
- Screenshot-compare and fix mismatches

---

## Summary

**No external API is needed.** I have the image, I have the codebase, and I have browser screenshot tools for verification. The work is systematic CSS variable updates + component layout changes across ~30 files.

**Say "start" and I'll begin with Phase 1** — the design system overhaul that transforms 80% of the site instantly. Then I'll screenshot-compare and iterate through the remaining phases.

