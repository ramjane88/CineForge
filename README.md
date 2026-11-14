# CineForge (web)

An AI filmmaking platform: a 14 day first film course with an AI coach, a prompt studio, a prompt library, weekly challenges with voting and duels, a portfolio with a rate calculator, and a job agent.

Stack: Next.js 14 (App Router), Supabase (auth and Postgres), Vercel. AI text runs on Groq.

This branch (`web`) is separate from the Android project on `main`.

## Run it

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev
```

With no environment variables the app still works. Data stays in the browser, and the AI and account features show a setup message.

## Set up Supabase

1. Create a project.
2. Open the SQL editor and run `supabase/schema.sql`.
3. Authentication, URL configuration: add your site URL and `http://localhost:3000`.
4. Optional: enable the Google provider for one tap sign in.
5. Copy the project URL and anon key into the environment.

## Deploy on Vercel

1. Import this repository and set the production branch to `web`.
2. Add the variables from `.env.example`.
3. Deploy.

## Environment

| Name | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `GROQ_API_KEY` | Server side key for the coach, prompt fixer and pitch writer |
| `GROQ_MODEL` | Optional, defaults to `llama-3.3-70b-versatile` |

## Layout

- `app/page.jsx` shell, tabs and sign in
- `components/` one file per station
- `lib/content.js` lessons, tracks, starter prompts and challenge briefs
- `lib/store.js` all data access, local first with Supabase sync
- `app/api/ai` Groq proxy, requires a signed in user when Supabase is configured
- `app/api/jobs` Remotive listings, cached for six hours
- `supabase/schema.sql` tables and row level security

## Not built yet

- In app image and video generation. It needs a model provider key and a credit system.
- Payments and membership.
- Moderation tools for the Arena.

Job listings come from the Remotive public API and link back to Remotive.
