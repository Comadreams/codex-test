# Dreamz Project (MVP)

Browser-based real-time collaborative storyboard/team project app built with Next.js + TypeScript + Tailwind.

## Features
- Project dashboard (create/rename/delete/select projects)
- Storyboard board with status columns
- Create/edit/delete cards
- Drag & drop cards between columns, reorder inside columns
- Card details: title, description, tags, notes/comments, image URL, attachment URL
- Near-live collaboration for multiple tabs/users using localStorage + BroadcastChannel
- Demo user display name support (placeholder for auth)

## Run locally
```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## MVP architecture notes
- Data layer is currently local-only for fast MVP shipping.
- This is Vercel-ready as a static/dynamic Next.js app; to make it production collaborative across devices, replace `lib/store.ts` with a hosted database/realtime provider (e.g. Supabase/Postgres + Realtime, Neon + websockets, or Convex).
- Auth insertion point: add authenticated user context and replace `username` input in `app/page.tsx`.
