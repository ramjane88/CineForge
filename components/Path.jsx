'use client';

import { useState } from 'react';
import { DAYS, TRACKS } from '../lib/content';
import { Area, Chips, useAI } from './ui';

export default function Path({ s }) {
  const [open, setOpen] = useState(1);
  const [track, setTrack] = useState('films');
  const [draft, setDraft] = useState({});
  const { ai, busy, run, say } = useAI(s);
  const done = DAYS.filter((d) => s.me.done['d' + d.d]).length;
  const minutesLeft = DAYS.filter((d) => !s.me.done['d' + d.d]).reduce((a, d) => a + d.m, 0);
  const tr = TRACKS.find((t) => t.k === track);

  function coach(d) {
    const txt = (draft[d.d] || '').trim();
    const key = 'coach' + d.d;
    if (!txt) return say(key, 'Paste your prompt or describe your attempt first.');
    run(
      key,
      'You are a film director coaching a beginner in AI filmmaking. Lesson: ' + d.t + '. Goal: ' + d.goal + ' Common mistake: ' + d.miss +
        '\n\nThe student submitted:\n' + txt +
        '\n\nReply in plain text with no markdown and no dashes. Give: one thing that works, the two most important fixes as concrete rewrites, and a corrected version they can paste. Under 140 words.'
    );
  }

  function markDone(d) {
    const was = !!s.me.done['d' + d.d];
    s.toggleDay(d.d);
    if (!was && d.d < 14) setOpen(d.d + 1);
  }

  return (
    <>
      <section>
        <p className="mono">Station 01 / The path</p>
        <h2>Your first AI film in 14 days</h2>
        <p className="lede">One shot a day, about an hour each. Every day ends with something made, and the coach reviews your attempt.</p>
        <div className="stats">
          <div className="stat"><b>{done}/14</b><span className="mono">Days done</span></div>
          <div className="stat"><b>{s.me.streak || 0}</b><span className="mono">Day streak</span></div>
          <div className="stat"><b>{minutesLeft}</b><span className="mono">Minutes left</span></div>
        </div>
        <div className="bar"><i style={{ width: Math.round((done / 14) * 100) + '%' }} /></div>
      </section>

      <section>
        {DAYS.map((d) => {
          const isDone = !!s.me.done['d' + d.d];
          const isOpen = open === d.d;
          const key = 'coach' + d.d;
          return (
            <div key={d.d} className={'day' + (isDone ? ' done' : '')}>
              <div className="day-num">{(d.d < 10 ? '0' : '') + d.d}</div>
              <div className="day-body">
                <button type="button" className="day-head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? 0 : d.d)}>
                  <h3>{d.t}</h3>
                  <span className={'pill' + (isDone ? ' good' : '')}>{isDone ? 'Done' : '~' + d.m + ' min'}</span>
                </button>
                {isOpen && (
                  <>
                    <p><strong>Goal.</strong> {d.goal}</p>
                    <ol className="steps">{d.steps.map((st, i) => <li key={i}>{st}</li>)}</ol>
                    <p><strong>Deliver.</strong> {d.task}</p>
                    <p className="note"><strong>Common miss.</strong> {d.miss}</p>
                    <Area label="Paste your prompt or describe what you made" value={draft[d.d] || ''} onChange={(v) => setDraft((x) => ({ ...x, [d.d]: v }))} placeholder="Example: Close up of an old fisherman, golden hour..." />
                    <div className="row">
                      <button type="button" className="btn sec" disabled={!!busy[key]} onClick={() => coach(d)}>Get coach feedback</button>
                      <button type="button" className="btn" onClick={() => markDone(d)}>{isDone ? 'Mark not done' : 'Mark day done'}</button>
                    </div>
                    {ai[key] && <div className="ai">{ai[key]}</div>}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </section>

      <section>
        <p className="mono">After day 14</p>
        <h2>Three paths and a bonus</h2>
        <Chips options={TRACKS.map((t) => [t.k, t.t])} value={track} onChange={setTrack} />
        {tr.l.map((l, i) => {
          const id = 't_' + tr.k + '_' + i;
          const dn = !!s.me.done[id];
          return (
            <div key={id} className="item">
              <div className="row between">
                <h4>{l[0]}</h4>
                <button type="button" className="btn ghost" onClick={() => s.updateMe((m) => { if (m.done[id]) delete m.done[id]; else m.done[id] = 1; })}>{dn ? 'Done' : 'Mark done'}</button>
              </div>
              <p className="muted">{l[1]}</p>
            </div>
          );
        })}
      </section>
    </>
  );
}
