'use client';

import { useState } from 'react';
import { okUrl, quoteText } from '../lib/logic';
import { Area, Field, Select } from './ui';

export default function Folio({ s }) {
  const p = s.profile;
  const r = s.me.rate;
  const [nr, setNr] = useState({ title: '', url: '', note: '' });
  const setP = (k) => (v) => s.updateProfile((x) => { x[k] = v; });
  const setR = (k) => (v) => s.updateMe((m) => { m.rate[k] = v; });
  const mine = s.user ? s.user.id : null;
  const others = s.shared.profiles.filter((x) => x.id !== mine && x.name);

  function addReel() {
    if (!nr.title.trim()) return;
    if (nr.url.trim() && !okUrl(nr.url)) return;
    s.updateProfile((x) => x.reels.push({ title: nr.title.trim(), url: nr.url.trim(), note: nr.note.trim() }));
    setNr({ title: '', url: '', note: '' });
  }

  return (
    <>
      <section>
        <p className="mono">Station 05 / Folio</p>
        <h2>Your portfolio</h2>
        <p className="lede">One page that sells one skill. Members can see it. The job agent uses it to write your pitches.</p>
        <div className="card">
          <Field label="Display name" value={p.name} onChange={setP('name')} />
          <Field label="Role" value={p.role} onChange={setP('role')} placeholder="AI filmmaker for beauty brands" />
          <Area label="Bio, two or three lines" value={p.bio} onChange={setP('bio')} />
          <Field label="Skills, comma separated" value={p.skills} onChange={setP('skills')} placeholder="character consistency, product shots, sound design" />
        </div>
      </section>

      <section>
        <h2>Reel</h2>
        {p.reels.map((x, i) => (
          <div key={i} className="item">
            <div className="row between">
              <h4>{x.title}</h4>
              <button type="button" className="btn ghost" onClick={() => s.updateProfile((d) => d.reels.splice(i, 1))}>Remove</button>
            </div>
            <p className="muted">{x.note}</p>
            {okUrl(x.url) && <a href={x.url} target="_blank" rel="noopener noreferrer">Watch</a>}
          </div>
        ))}
        <div className="card">
          <h4>Add a piece</h4>
          <Field label="Title" value={nr.title} onChange={(v) => setNr((x) => ({ ...x, title: v }))} />
          <Field label="Link" type="url" value={nr.url} onChange={(v) => setNr((x) => ({ ...x, url: v }))} placeholder="https://" />
          <Field label="Two line breakdown" value={nr.note} onChange={(v) => setNr((x) => ({ ...x, note: v }))} />
          <div className="row">
            <button type="button" className="btn sec" onClick={addReel}>Add to reel</button>
          </div>
        </div>
      </section>

      <section>
        <h2>Rate calculator</h2>
        <p className="lede">Quote the job, not the hour. Adjust until the number matches the work. Only you can see this.</p>
        <div className="card">
          <div className="grid2">
            <Field label="Currency" value={r.cur} onChange={setR('cur')} />
            <Field label="Your hourly floor" type="number" min="0" value={r.hour} onChange={setR('hour')} />
            <Field label="Finished seconds" type="number" min="0" value={r.secs} onChange={setR('secs')} />
            <Field label="Revision rounds" type="number" min="0" value={r.rev} onChange={setR('rev')} />
          </div>
          <div className="grid2">
            <Select label="Complexity, 1 simple to 3 hard" value={String(r.complexity)} onChange={(v) => setR('complexity')(Number(v))} options={['1', '2', '3']} />
            <Select label="Usage" value={r.usage} onChange={setR('usage')} options={['organic', 'paid ads']} />
          </div>
          <div className="out">{quoteText(r)}</div>
        </div>
      </section>

      <section>
        <h2>Members</h2>
        {!others.length && <p className="muted">No other members yet. Share the site to bring people in.</p>}
        {others.map((x) => (
          <div key={x.id} className="item">
            <h4>{x.name}</h4>
            <p className="mono">{x.role}</p>
            <p className="muted">{x.bio}</p>
          </div>
        ))}
      </section>
    </>
  );
}
