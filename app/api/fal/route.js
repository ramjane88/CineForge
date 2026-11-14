export const runtime = 'nodejs';

// Thin proxy to fal's queue API. The fal key travels from the user's browser in
// x-fal-key and is never stored here. Two operations:
//   { op: 'submit', endpoint, input }  queue a job
//   { op: 'get', url }                 read a status_url or response_url fal returned
const QUEUE = 'https://queue.fal.run/';

function message(j, status) {
  if (!j) return 'fal returned an error (' + status + ').';
  if (typeof j.detail === 'string') return j.detail;
  if (Array.isArray(j.detail)) return j.detail.map((d) => (d && d.msg) || '').filter(Boolean).join('; ') || 'fal rejected the request.';
  return j.error || j.message || 'fal returned an error (' + status + ').';
}

export async function POST(req) {
  const key = req.headers.get('x-fal-key');
  if (!key) return Response.json({ error: 'Add your fal key in the Keys tab.' }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return Response.json({ error: 'Bad request.' }, { status: 400 });
  }

  let url;
  let init;
  if (body.op === 'submit') {
    const endpoint = String(body.endpoint || '');
    if (!/^[a-z0-9][a-z0-9._/-]*$/i.test(endpoint) || endpoint.includes('..')) return Response.json({ error: 'Bad model id.' }, { status: 400 });
    url = QUEUE + endpoint;
    init = { method: 'POST', body: JSON.stringify(body.input || {}) };
  } else if (body.op === 'get') {
    url = String(body.url || '');
    if (!url.startsWith(QUEUE)) return Response.json({ error: 'Bad job url.' }, { status: 400 });
    init = { method: 'GET' };
  } else {
    return Response.json({ error: 'Unknown operation.' }, { status: 400 });
  }

  try {
    const r = await fetch(url, { ...init, headers: { authorization: 'Key ' + key, 'content-type': 'application/json' }, cache: 'no-store' });
    const j = await r.json().catch(() => null);
    if (r.status === 401 || r.status === 403) return Response.json({ error: 'fal rejected the key or the account has no credit.' }, { status: 401 });
    if (!r.ok) return Response.json({ error: message(j, r.status) }, { status: 502 });
    return Response.json(j || {});
  } catch (e) {
    return Response.json({ error: 'fal could not be reached.' }, { status: 502 });
  }
}
