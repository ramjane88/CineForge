import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

// Text generation for the coach, the prompt fixer and the pitch writer.
// When Supabase is configured the caller must be signed in, so the key cannot be drained anonymously.
export async function POST(req) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return Response.json({ error: 'AI is not configured yet. Add GROQ_API_KEY in the Vercel project settings.' }, { status: 501 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && anon) {
    const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    if (!token) return Response.json({ error: 'Sign in to use the AI director.' }, { status: 401 });
    const { data, error } = await createClient(url, anon).auth.getUser(token);
    if (error || !data.user) return Response.json({ error: 'Sign in to use the AI director.' }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return Response.json({ error: 'Bad request.' }, { status: 400 });
  }
  const prompt = String((body && body.prompt) || '').slice(0, 6000);
  if (!prompt.trim()) return Response.json({ error: 'Empty prompt.' }, { status: 400 });

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        temperature: 0.6,
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!r.ok) return Response.json({ error: 'The AI provider returned an error (' + r.status + ').' }, { status: 502 });
    const j = await r.json();
    const text = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '';
    return Response.json({ text: text.trim() });
  } catch (e) {
    return Response.json({ error: 'The AI provider could not be reached.' }, { status: 502 });
  }
}
