export const runtime = 'nodejs';

// Text generation for the shot writer. The Groq key comes from the caller's own
// browser (x-groq-key) or, if set, from the GROQ_API_KEY environment variable.
export async function POST(req) {
  const key = req.headers.get('x-groq-key') || process.env.GROQ_API_KEY;
  if (!key) return Response.json({ error: 'Add your Groq key in the Keys tab to use the shot writer.' }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return Response.json({ error: 'Bad request.' }, { status: 400 });
  }
  const prompt = String((body && body.prompt) || '').slice(0, 8000);
  if (!prompt.trim()) return Response.json({ error: 'Empty prompt.' }, { status: 400 });
  const max = Math.min(Math.max(Number(body.max) || 600, 100), 2000);

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
