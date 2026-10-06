# Responsive restaurant site redesign

## Goal

Rebuild the public experience so it feels like a polished highway restaurant on phones, desktops, and large 75-inch/4K displays, while keeping all existing verified business facts and dine-in ordering rules.

## What will change

- Add a shared restaurant header across public pages with Home, Menu & Order, directions, and a light/dark theme toggle.
- Redesign the homepage into a spacious editorial layout with the editable banner, verified trust details, dine-in ordering steps, location, hours, and stronger menu call-to-actions.
- Move the full menu and ordering flow to a dedicated `/menu` page with category navigation, responsive menu cards, and the existing persistent cart and WhatsApp kitchen order flow.
- Replace the narrow desktop canvas with fluid, capped layouts that use wide screens well and remain readable on TVs; preserve focused content widths for text.
- Improve large-screen image quality by allowing higher-resolution admin banner uploads while keeping the existing fallback image.
- Keep `/admin` functional and make its workspace use desktop width more effectively without changing permissions or workflows.

## Theme behavior

- Support polished light and dark color systems using semantic tokens.
- Default to the visitor’s device preference, remember their choice, and avoid a flash of the wrong theme when loading.
- Keep the established charcoal and tandoor-amber identity in dark mode; use a warm paper-like light mode with strong contrast.

## Technical details

- Create the `/menu` TanStack route with unique page metadata and route-level menu loading.
- Keep homepage loading limited to banner/contact settings.
- Add shared public navigation and theme controls through the root layout, while keeping the admin interface separate and secure.
- Use existing Button components for actions and preserve reduced-motion support for the 3D scroll effects.
- Verify phone, desktop, and 1920×1080 large-screen layouts, plus the complete add-to-cart and order-drawer interaction.

## Guardrails

- Do not add delivery, takeaway, car service, fake menu items, prices, phone numbers, testimonials, or other unverified business details.
- Preserve the exact dine-in WhatsApp order format and owner/staff access model.
