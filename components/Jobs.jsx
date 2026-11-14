'use client';

import { useState } from 'react';
import { JOB_STATUS } from '../lib/content';
import { okUrl, uid7 } from '../lib/logic';
import { Area, CopyButton, Field, Select, useAI } from './ui';

export default function Jobs({ s }) {
  const [q, setQ] = useState('video');
  const [scan, setScan] = useState({ busy: false, jobs: null, note: '' });
  const [nj, setNj] = useState({ title: '', company: '', url: '' });
  const { ai, busy, run } = useAI(s);
  const p = s.profile;

  async function doScan() {
    setScan({ busy: true, jobs: null, note: '' });
    const res = await s.searchJobs(q.trim() || 'video');
    setScan({ busy: false, jobs: res.jobs || [], note: res.error || (res.jobs && res.jobs.length ? res.jobs.length + ' listings found.' : 'No listings matched. Try a broader keyword.') });
  }

  function track(j) {
    s.updateMe((m) => m.jobs.unshift({ id: uid7(), title: j.title, company: j.company || '', url: j.url || '', status: 'Saved', note: [j.location, j.type, j.salary].filter(Boolean).join(', ') }));
  }

  function addByHand() {
    if (!nj.title.trim()) return;
    s.updateMe((m) => m.jobs.unshift({ id: uid7(), title: nj.title.trim(), company: nj.company.trim(), url: okUrl(nj.url) ? nj.url.trim() : '', status: 'Saved', note: '' }));
    setNj({ title: '', company: '', url: '' });
  }

  function pitch(j) {
    run(
      'pitch' + j.id,
      'Write a short freelance pitch for this job. Plain text, no markdown, no dashes, under 90 words. Structure: their problem in one line, my proof in two lines drawn only from my portfolio below, one clear next step. Do not invent experience I have not listed. If the portfolio is empty, say what I should add before pitching.\n\nJob: ' +
        j.title + (j.company ? ' at ' + j.company : '') + '\nBrief notes: ' + (j.note || 'none') +
        '\n\nMy portfolio\nName: ' + (p.name || 'not set') + '\nRole: ' + (p.role || 'not set') + '\nBio: ' + (p.bio || 'not set') + '\nSkills: ' + (p.skills || 'not set') +
        '\nReel: ' + (p.reels.map((r) => r.title + (r.note ? ' (' + r.note + ')' : '')).join('; ') || 'empty')
    );
  }

  return (
    <>
      <section>
        <p className="mono">Station 06 / Jobs</p>
        <h2>Job agent</h2>
        <p className="lede">Scan remote listings, save the ones that fit, and get a pitch written from your Folio.</p>
        <div className="card">
          <Field label="Keywords" value={q} onChange={setQ} placeholder="video, motion, creative" />
          <div className="row">
            <button type="button" className="btn" disabled={scan.busy} onClick={doScan}>{scan.busy ? 'Scanning...' : 'Scan listings'}</button>
            <span className="note">Listings by <a href="https://remotive.com" target="_blank" rel="noopener noreferrer">Remotive</a>. Refreshed every six hours.</span>
          </div>
          {scan.note && <p className="note">{scan.note}</p>}
          {(scan.jobs || []).map((j, i) => (
            <div key={i} className="item">
              <h4>{okUrl(j.url) ? <a href={j.url} target="_blank" rel="noopener noreferrer">{j.title}</a> : j.title}</h4>
              <p className="mono">{[j.company, j.location, j.type].filter(Boolean).join(' / ')}</p>
              {j.salary && <p className="muted">{j.salary}</p>}
              <div className="row">
                <button type="button" className="btn ghost" onClick={() => track(j)}>Save to tracker</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Tracker</h2>
        {!s.me.jobs.length && <p className="muted">Nothing tracked yet.</p>}
        {s.me.jobs.map((j, i) => {
          const key = 'pitch' + j.id;
          return (
            <div key={j.id} className="card">
              <div className="row between">
                <h4>{okUrl(j.url) ? <a href={j.url} target="_blank" rel="noopener noreferrer">{j.title}</a> : j.title}</h4>
                <button type="button" className="btn ghost" onClick={() => s.updateMe((m) => m.jobs.splice(i, 1))}>Remove</button>
              </div>
              {j.company && <p className="mono">{j.company}</p>}
              <Select label="Status" value={j.status} onChange={(v) => s.updateMe((m) => { m.jobs[i].status = v; })} options={JOB_STATUS} />
              <Area label="Notes on the brief" value={j.note || ''} onChange={(v) => s.updateMe((m) => { m.jobs[i].note = v; })} placeholder="What they need, budget, deadline" />
              <div className="row">
                <button type="button" className="btn sec" disabled={!!busy[key]} onClick={() => pitch(j)}>Write my pitch</button>
                {ai[key] && !busy[key] && <CopyButton text={ai[key]} label="Copy pitch" />}
              </div>
              {ai[key] && <div className="ai">{ai[key]}</div>}
            </div>
          );
        })}
        <div className="card">
          <h4>Add a job by hand</h4>
          <Field label="Title" value={nj.title} onChange={(v) => setNj((x) => ({ ...x, title: v }))} />
          <Field label="Company or client" value={nj.company} onChange={(v) => setNj((x) => ({ ...x, company: v }))} />
          <Field label="Link" type="url" value={nj.url} onChange={(v) => setNj((x) => ({ ...x, url: v }))} placeholder="https://" />
          <div className="row">
            <button type="button" className="btn sec" onClick={addByHand}>Add to tracker</button>
          </div>
        </div>
      </section>
    </>
  );
}
