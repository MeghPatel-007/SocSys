# SocSys Frontend

Frontend for SocSys using Next.js App Router with React views.

## Scripts

- `npm run dev` starts Next.js in development mode
- `npm run build` creates a production build
- `npm run start` runs the production server
- `npm run tw:build` compiles Tailwind from `src/styles/input.css` to `src/styles/output.css`
- `npm run tw:watch` watches and rebuilds Tailwind output

## Environment

Create a local env file from `.env.local.example` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
