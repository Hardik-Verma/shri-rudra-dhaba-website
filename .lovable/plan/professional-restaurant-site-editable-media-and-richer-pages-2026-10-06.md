# Professional restaurant site, editable media, and richer pages

## What will change
- Keep the compile fixes already applied and preserve the strict dine-in ordering flow.
- Add separate **About**, **Gallery**, and **Visit** pages, using the reference site only for page ideas—not its business details or copy.
- Expand the shared navigation and footer so every public page is easy to reach on mobile, desktop, and large displays.
- Use only verified Shri Rudra details: NH-734 address, coordinates/plus code, daily 6 AM–11 PM hours with the timing disclaimer, and the public rating snapshot already shown. No invented phone, amenities, menu, or history.
- Upgrade the homepage into a more polished restaurant experience with stronger location trust, a preview of the story/gallery, and direct menu and directions actions.
- Let admins manage the homepage banner as either an image or uploaded video, plus editable About-page images and a gallery of uploaded photos.
- Keep every menu item editable, including its food image, description, category, price, diet type, and availability.

## Technical details
- Extend site settings with homepage video and About-page copy/media fields, using safe defaults for existing installations.
- Add an admin-managed gallery table with public reads, authenticated admin-only writes, explicit grants, and row-level access rules.
- Store uploaded public images/videos in the existing media bucket under dedicated folders; allow public viewing while keeping admin-only uploads and deletes.
- Render banner videos with autoplay, muted, loop, plays-inline behavior and an image fallback; respect reduced-motion preferences.
- Add unique title, description, Open Graph title/description, `og:type`, and Twitter card metadata to every public route.

## Verification
- Confirm the current compile errors are gone.
- Test navigation, banner image/video selection, gallery management, and menu-item editing.
- Check Home, Menu, About, Gallery, Visit, and Admin on phone, desktop, and TV-sized layouts with no overflow or runtime errors.
