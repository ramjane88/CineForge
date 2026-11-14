export const runtime = 'edge';

// Streams a generated image or clip back through this origin so the browser can
// draw it on a canvas (needed to save start frames and to stitch the film).
// Only hosts used by the two engines are allowed.
const ALLOWED = [/(^|\.)fal\.media$/i, /(^|\.)fal\.run$/i, /(^|\.)fal\.ai$/i, /(^|\.)hf\.space$/i];

export async function GET(req) {
  const raw = new URL(req.url).searchParams.get('url') || '';
  let target;
  try {
    target = new URL(raw);
  } catch (e) {
    return new Response('Bad url', { status: 400 });
  }
  if (target.protocol !== 'https:' || !ALLOWED.some((re) => re.test(target.hostname))) return new Response('Host not allowed', { status: 400 });

  const r = await fetch(target.toString(), { cache: 'no-store' });
  if (!r.ok || !r.body) return new Response('Upstream error', { status: 502 });
  return new Response(r.body, {
    headers: {
      'content-type': r.headers.get('content-type') || 'application/octet-stream',
      'cache-control': 'private, max-age=3600',
    },
  });
}
