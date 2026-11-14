'use client';

import { useState } from 'react';
import { PCATS, STARTERS } from '../lib/content';
import { uid7 } from '../lib/logic';
import { Area, Chips, CopyButton, Field } from './ui';

export default function Prompts({ s }) {
  const [cat, setCat] = useState('Film');
  const [q, setQ] = useState('');
  const [np, setNp] = useState({ title: '', text: '' });
  const mine = s.user ? s.user.id : null;

  let list;
  if (cat === 'Mine') list = s.me.saved.map((p, i) => ({ key: p.id || 'm' + i, t: p.title, x: p.text, mine: i }));
  else if (cat === 'Community') list = s.shared.prompts.map((p) => ({ key: p.id, t: p.title, x: p.text, by: p.byName, id: p.id, own: p.by === mine }));
  else list = STARTERS.filter((p) => p[0] === cat).map((p) => ({ key: p[1], t: p[1], x: p[2] }));
  const needle = q.trim().toLowerCase();
  if (needle) list = list.filter((p) => (p.t + ' ' + p.x).toLowerCase().includes(needle));

  const empty =
    cat === 'Mine' ? 'Nothing saved yet. Save one from the Studio or add it below.'
    : cat === 'Community' ? (s.cloud ? 'No shared prompts yet. Share one from Mine.' : 'Sharing needs the cloud connection, which is not configured.')
    : 'No match.';

  function add() {
    if (!np.text.trim()) return;
    s.updateMe((m) => m.saved.unshift({ id: uid7(), title: np.title.trim() || 'Untitled', text: np.text.trim() }));
    setNp({ title: '', text: '' });
  }

  async function share(i) {
    const ok = await s.sharePrompt(s.me.saved[i]);
    if (ok) setCat('Community');
  }

  return (
    <section>
      <p className="mono">Station 03 / Prompts</p>
      <h2>Prompt library</h2>
      <p className="lede">Starter shots by job type, your own saved prompts, and prompts shared by members.</p>
      <Chips options={PCATS.map((c) => [c, c])} value={cat} onChange={setCat} />
      <Field label="Search" value={q} onChange={setQ} placeholder="lantern, macro, vertical" />
      {!list.length && <p className="muted">{empty}</p>}
      {list.map((p) => (
        <div key={p.key} className="item">
          <div className="row between">
            <h4>{p.t}</h4>
            {p.by && <span className="mono">{p.by}</span>}
          </div>
          <div className="out">{p.x}</div>
          <div className="row">
            <CopyButton text={p.x} />
            {p.mine != null && s.cloud && s.user && <button type="button" className="btn ghost" onClick={() => share(p.mine)}>Share with members</button>}
            {p.mine != null && <button type="button" className="btn ghost" onClick={() => s.updateMe((m) => m.saved.splice(p.mine, 1))}>Remove</button>}
            {p.own && <button type="button" className="btn ghost" onClick={() => s.unsharePrompt(p.id)}>Unshare</button>}
          </div>
        </div>
      ))}
      {cat === 'Mine' && (
        <div className="card">
          <h4>Add a prompt</h4>
          <Field label="Title" value={np.title} onChange={(v) => setNp((x) => ({ ...x, title: v }))} />
          <Area label="Prompt" value={np.text} onChange={(v) => setNp((x) => ({ ...x, text: v }))} />
          <div className="row">
            <button type="button" className="btn sec" onClick={add}>Save</button>
          </div>
        </div>
      )}
    </section>
  );
}
