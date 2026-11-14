'use client';

import { useState } from 'react';
import { BRIEFS } from '../lib/content';
import { okUrl, weekNo } from '../lib/logic';
import { Field } from './ui';

function pickPair(es) {
  const i = Math.floor(Math.random() * es.length);
  let j = Math.floor(Math.random() * (es.length - 1));
  if (j >= i) j += 1;
  return [es[i].id, es[j].id];
}

export default function Arena({ s }) {
  const w = weekNo();
  const brief = BRIEFS[w.n % BRIEFS.length];
  const [entry, setEntry] = useState({ title: '', url: '', logline: '', tools: '' });
  const [msg, setMsg] = useState('');
  const [pair, setPair] = useState(null);
  const mine = s.user ? s.user.id : null;
  const es = s.shared.entries.filter((e) => e.week === w.id).sort((a, b) => s.score(b.id) - s.score(a.id));
  const set = (k) => (v) => setEntry((x) => ({ ...x, [k]: v }));

  async function submit() {
    if (!entry.title.trim()) return setMsg('Give it a title.');
    if (entry.url.trim() && !okUrl(entry.url)) return setMsg('The link must start with https://');
    const res = await s.submitEntry({ title: entry.title.trim(), url: entry.url.trim(), logline: entry.logline.trim(), tools: entry.tools.trim(), week: w.id });
    setMsg(res);
    if (res === 'Submitted.') setEntry({ title: '', url: '', logline: '', tools: '' });
  }

  const valid = pair && es.some((e) => e.id === pair[0]) && es.some((e) => e.id === pair[1]);
  const duel = es.length >= 2 ? (valid ? pair : [es[0].id, es[1].id]) : null;
  const duelists = duel ? duel.map((id) => es.find((e) => e.id === id)) : [];

  return (
    <>
      <section>
        <p className="mono">Station 04 / Arena / {w.id}</p>
        <h2>{brief[0]}</h2>
        <p className="lede">{brief[1]} Post your entry, vote on others, and settle ties in a duel.</p>
        {!s.cloud && <p className="note">Cloud is not configured, so entries stay on this device.</p>}
        <div className="card">
          <h4>Submit an entry</h4>
          <Field label="Title" value={entry.title} onChange={set('title')} />
          <Field label="Link to your video" type="url" value={entry.url} onChange={set('url')} placeholder="https://" />
          <Field label="One line pitch" value={entry.logline} onChange={set('logline')} />
          <Field label="Tools used" value={entry.tools} onChange={set('tools')} />
          <div className="row">
            <button type="button" className="btn" onClick={submit}>Submit</button>
            <span className="note">{msg}</span>
          </div>
        </div>
      </section>

      <section>
        <div className="row between">
          <h2>Leaderboard</h2>
          <button type="button" className="btn ghost" onClick={() => s.refresh()}>Refresh</button>
        </div>
        {!es.length && <p className="muted">No entries this week. Yours can be first.</p>}
        {es.map((e, i) => {
          const voted = !!s.votes.picks[e.id];
          return (
            <div key={e.id} className="item">
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <span className="rank">{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <h4>{e.title}</h4>
                  <p className="muted">{e.logline}</p>
                  <p className="mono">{(e.byName || 'Anonymous') + (e.tools ? ' / ' + e.tools : '')}</p>
                  <div className="row">
                    {okUrl(e.url) && <a href={e.url} target="_blank" rel="noopener noreferrer">Watch</a>}
                    <button type="button" className="chip" aria-pressed={voted} onClick={() => s.updateVotes((v) => { if (v.picks[e.id]) delete v.picks[e.id]; else v.picks[e.id] = 1; })}>
                      {(voted ? 'Voted' : 'Vote') + ' / ' + s.score(e.id)}
                    </button>
                    {(e.by === 'local' || (mine && e.by === mine)) && <button type="button" className="btn ghost" onClick={() => s.deleteEntry(e.id)}>Remove</button>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section>
        <h2>Duel</h2>
        <p className="lede">Two entries, one pick. Each win adds a point.</p>
        {!duel && <p className="muted">Duels open when there are two entries.</p>}
        {duel && (
          <>
            <div className="duel">
              {duelists.map((e) => (
                <button key={e.id} type="button" onClick={() => { s.updateVotes((v) => { v.wins[e.id] = (Number(v.wins[e.id]) || 0) + 1; }); setPair(pickPair(es)); }}>
                  <h4>{e.title}</h4>
                  <span className="muted">{e.logline}</span>
                  <span className="mono">Pick this one</span>
                </button>
              ))}
            </div>
            <div className="row">
              <button type="button" className="btn ghost" onClick={() => setPair(pickPair(es))}>Skip pair</button>
            </div>
          </>
        )}
      </section>
    </>
  );
}
