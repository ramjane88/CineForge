# CineForge (web)

Turn an idea into a short film in the browser.

1. **Idea**: describe the film. The shot writer breaks it into shots.
2. **Shots**: each shot gets a start frame, then an engine animates it into a real clip. Regenerate takes and pick the best.
3. **Film**: watch the clips back to back and export one video file.

Stack: Next.js 14 (App Router) on Vercel. No database. The project lives in the browser.

This branch (`web`) is separate from the Android project on `main`.

## Engines

| Job | Free engine | Paid engine |
| --- | --- | --- |
| Start frame | FLUX.1 schnell Space on Hugging Face | `fal-ai/flux/schnell` |
| Clip | Wan 2.2 image to video Space on Hugging Face | Wan 2.2 Turbo on fal.ai, text or image to video, listed at $0.05 per clip at 480p |
| Shot list | Groq | Groq |

Keys are pasted in the Keys tab and stay in the browser. Model ids are editable there, because providers rename and retire models. fal lists its Wan 2.2 endpoints for removal on 4 January 2027.

The free engine runs on shared community Spaces with a small daily GPU quota. It can be slow, busy or renamed without notice.

## Run it

```bash
npm install
npm run dev
```

## Deploy

```bash
npx vercel --prod
```

## Layout

- `app/page.jsx` shell and tabs
- `components/` Idea, Shots, Film, Keys
- `lib/project.js` project state in localStorage
- `lib/engines.js` shot writer, fal, Hugging Face Spaces, film export
- `app/api/ai` Groq proxy
- `app/api/fal` fal queue proxy
- `app/api/media` same origin stream of generated files, limited to engine hosts

## Not built yet

- Sound, music and voice.
- Cloud accounts and sync across devices.
- Resuming a paid job after the tab is closed.
