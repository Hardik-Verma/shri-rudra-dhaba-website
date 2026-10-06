# Faster menu import and full item customization

## What will change
- Speed up PDF reading by using a faster menu-extraction model, add a clear time limit, and show an honest progress state instead of waiting indefinitely.
- Restore normal system typography across the public site and owner panel.
- Give every menu item a clearly visible restaurant-style background, with a consistent fallback when no food photo is set.
- Always show a description area; missing source descriptions will say “Description not provided” rather than inventing food details.
- Expand the owner panel so each existing and newly imported item can edit its name, category, description, price, veg status, availability, and optional food photo.
- Preserve the existing review-before-publish step for imported PDFs.

## Technical details
- Add an optional image field to menu items with authenticated admin-only writes and existing public reads.
- Store optimized food photos in the existing private media storage and serve them through controlled URLs; use a designed card background fallback when absent.
- Add save/cancel editing controls per item and refresh the public menu immediately after successful updates.
- Keep extraction faithful to the PDF: descriptions remain empty when the official document has none.

## Verification
- Test PDF import feedback and timeout behavior.
- Test item editing and photo customization in the owner panel.
- Check menu cards, typography, and contrast on phone, desktop, and large-screen layouts.
