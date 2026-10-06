# Shri Rudra Dhaba — Website

Highway restaurant site (TanStack Start + React + Tailwind) with a live menu, WhatsApp
dine-in ordering, and an Admin Panel backed by Supabase.

## Local development

You need Node.js 22 and npm.

```sh
git clone https://github.com/Hardik-Verma/shri-rudra-dhaba-website
cd shri-rudra-dhaba-website
cp .env.example .env   # then fill in your Supabase keys
npm install
npm run dev            # opens on the first free port from 8080
```

| Script            | What it does                                      |
| ----------------- | ------------------------------------------------- |
| `npm run dev`     | Local dev server with hot reload                  |
| `npm run build`   | Production build (`.output/`, Cloudflare default) |
| `npm run preview` | Serve the production build locally                |
| `npm run lint`    | ESLint (must be clean)                            |
| `npm run format`  | Prettier write                                    |

On Render the build runs with `NITRO_PRESET=node-server` (see `render.yaml`) so the
same output serves as a plain Node server.

## Admin access

- Open `/admin` and sign in. There is **no public signup** — accounts are created
  by the owner inside StaffSection, so no confirmation email is ever needed.
- Supabase Dashboard → Authentication → Configuration → turn OFF
  **"Allow new users to sign up"** so nobody can register via the API either.
- Email confirmation: turn OFF **"Confirm email"** under the Email provider
  (staff accounts are created pre-confirmed). If you keep it on, set **Site URL**
  to your live domain and add `https://<domain>/**` under Redirect URLs,
  otherwise confirmation links point at localhost.

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
- Supabase
