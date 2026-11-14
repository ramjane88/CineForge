export const runtime = 'nodejs';

// Remote job listings from Remotive's public API.
// Their terms ask for few requests and a visible credit, so results are cached for six hours
// and the UI links back to Remotive.
export async function GET(req) {
  const q = (new URL(req.url).searchParams.get('q') || 'video').slice(0, 60);
  try {
    const r = await fetch('https://remotive.com/api/remote-jobs?limit=25&search=' + encodeURIComponent(q), { next: { revalidate: 21600 } });
    if (!r.ok) throw new Error(String(r.status));
    const j = await r.json();
    const jobs = (j.jobs || []).map((x) => ({
      title: x.title || '',
      company: x.company_name || '',
      url: x.url || '',
      location: x.candidate_required_location || '',
      type: x.job_type || '',
      salary: x.salary || '',
    }));
    return Response.json({ jobs, source: 'Remotive' });
  } catch (e) {
    return Response.json({ jobs: [], error: 'The job source did not answer. Try again later.' }, { status: 502 });
  }
}
