

## Replace Saturn Logo and Favicon with New Pixel Planet Logo

The uploaded pixel art planet logo needs to replace the current Saturn logo everywhere — both as the site logo and as the favicon.

### What changes

**Files to copy** (the uploaded image):
- `user-uploads://FullLogo_Transparent_NoBuffer.png` → `src/assets/saturn-logo.png` (replaces existing, used by ES6 imports)
- `user-uploads://FullLogo_Transparent_NoBuffer.png` → `public/saturn-logo.png` (replaces existing, used by direct URL refs)
- `user-uploads://FullLogo_Transparent_NoBuffer.png` → `public/favicon.png` (replaces existing favicon)

**No code changes needed.** All 17+ files that reference `saturn-logo.png` (via `import saturnLogo from "@/assets/saturn-logo.png"` or `src="/saturn-logo.png"`) will automatically pick up the new image since we're replacing the files in-place. The favicon in `index.html` already points to `/favicon.png`.

This covers:
- Sidebar logo
- App header Panel button icon
- Home page hero logo
- Footer logo
- Launchpad header
- Token detail header
- Panel page logo
- Privy auth modal logo
- King of the Hill section logo
- Bags/Agents page logo
- Earnings page logo
- Merch pages (use `saturn-merch-logo.png` — separate file, unchanged)

