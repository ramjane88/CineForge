export const runtime = 'nodejs';

// Text generation for the shot writer. Uses Claude when the caller sends an
// Anthropic key (x-anthropic-key or ANTHROPIC_API_KEY), otherwise Groq
// (x-groq-key or GROQ_API_KEY). Keys come from the caller's own browser.
async function claude(key, prompt, max) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: process.env.CLAUDE_MODEL || 'claude-haiku-5-5', max_tokens: max, messages: [{ role: 'user', content: prompt }] }),
  });
  if (r.status === 401) return Response.json({ error: 'Anthropic rejected the Claude key. Check it in the Keys tab.' }, { status: 401 });
  if (!r.ok) return Response.json({ error: 'Claude returned an error (' + r.status + ').' }, { status: 502 });
  const j = await r.json();
  const text = (j.content || []).map((c) => (c && c.type === 'text' ? c.text : '')).join('');
  return Response.json({ text: text.trim() });
}

export async function POST(req) {
  const anthropic = req.headers.get('x-anthropic-key') || process.env.ANTHROPIC_API_KEY;
  const key = req.headers.get('x-groq-key') || process.env.GROQ_API_KEY;
  if (!anthropic && !key) return Response.json({ error: 'Add a Claude or Groq key in the Keys tab to use the shot writer.' }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return Response.json({ error: 'Bad request.' }, { status: 400 });
  }
  const prompt = String((body && body.prompt) || '').slice(0, 8000);
  if (!prompt.trim()) return Response.json({ error: 'Empty prompt.' }, { status: 400 });
  const max = Math.min(Math.max(Number(body.max) || 600, 100), 2000);

  if (anthropic) {
    try {
      return await claude(anthropic, prompt, max);
    } catch (e) {
      return Response.json({ error: 'Claude could not be reached.' }, { status: 502 });
    }
  }

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: max,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (r.status === 401) return Response.json({ error: 'Groq rejected the key. Check it in the Keys tab.' }, { status: 401 });
    if (!r.ok) return Response.json({ error: 'Groq returned an error (' + r.status + ').' }, { status: 502 });
    const j = await r.json();
    const text = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '';
    return Response.json({ text: text.trim() });
  } catch (e) {
    return Response.json({ error: 'Groq could not be reached.' }, { status: 502 });
  }
}
