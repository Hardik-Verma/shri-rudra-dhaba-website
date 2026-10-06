<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## Architecture rules

- Menu items, homepage banner, and contact settings live in database tables editable only by admins (user_roles + has_role); owner role is granted to a fixed owner email on signup; the owner manages staff and transfers ownership via owner-checked server functions — keeps business data owner-controlled.
- Menu PDF imports are parsed fully on-device (position-aware text lines + rule-based parsing in `src/lib/menu-parse.ts`, tested) — no AI service, API key, or upload needed.
- Optional food photos are optimized in the browser and stored with each menu item — keeps menu presentation owner-editable without a separate media-management workflow.
- Menu PDFs upload temporarily to the private `site-media` bucket (100 MB maximum), are parsed through a signed URL, and are deleted afterward — avoids oversized browser-to-function payloads.
- Cart state is client-only (localStorage) and orders go out via wa.me links — no order storage needed for a dine-in WhatsApp flow.
- Public restaurant navigation is shared across `/` and `/menu`; the homepage presents the brand and location while `/menu` owns browsing and dine-in ordering — keeps marketing and ordering focused.
- Theme preference is client-persisted and applied before paint with semantic light/dark CSS tokens — prevents theme flashes and keeps both modes consistent.
- Public-page media and copy are database-managed by admins, with an optional image or video homepage banner — keeps published storytelling owner-controlled.
