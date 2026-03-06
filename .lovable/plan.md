

## Plan: Add Edit Profile to User Profile Page (X.com-style)

### Current State
- `/profile/:identifier` page exists but is **read-only** — no edit button
- `SettingsModal` only edits display name + avatar (no username, bio, cover, location, website)
- `update-profile` edge function already supports all fields (display_name, bio, location, website, avatar_url, cover_url, username)
- Profiles table has: username, display_name, bio, avatar_url, cover_url, location, website

### What Will Be Built

**1. Edit Profile Modal** (`src/components/profile/EditProfileModal.tsx`)
- X.com-style modal with:
  - **Cover photo** upload (click to change, with camera overlay)
  - **Avatar** upload (click to change, with camera overlay)
  - **Display Name** text field
  - **Username** text field (with @prefix, shows cooldown warning if recently changed via `username_changed_at`)
  - **Bio** textarea (max ~160 chars)
  - **Location** text field
  - **Website** text field
- Uses the existing `update-profile` edge function for saving
- Uses the existing `avatars` storage bucket for avatar uploads
- Cover photos stored in same bucket under `{profileId}/cover.{ext}`

**2. "Edit Profile" Button on UserProfilePage**
- Shows only when `isOwnProfile` is true (already detected in the page)
- Opens the EditProfileModal
- After save, refetches profile data

**3. "Edit Profile" entry in wallet dropdown**
- The existing "Edit profile" link in HeaderWalletBalance currently opens SettingsModal
- Update it to navigate to `/profile/{username}` where they can use the new edit button (or keep opening SettingsModal but enhance it — simpler to add the button on the profile page)

### Files to Create/Modify
1. **Create** `src/components/profile/EditProfileModal.tsx` — the X.com-style edit modal
2. **Modify** `src/pages/UserProfilePage.tsx` — add "Edit Profile" button when viewing own profile, wire up the modal
3. **Modify** `src/components/layout/HeaderWalletBalance.tsx` — update "Edit profile" link to navigate to own profile page

