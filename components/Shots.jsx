'use client';

import { useState } from 'react';
import { newShot, pickedClip, uid } from '../lib/project';
import { falImage, falVideo, hfImage, hfVideo, toFrame } from '../lib/engines';
import { Area, Chips, Field } from './ui';

export default function Shots({ p, go }) {
  const { project, settings, update, updateSettings, live } = p;
  const [busy, setBusy] = useState({});
  const [err, setErr] = useState({});
  const [confirm, setConfirm] = useState('');
  const [all, setAll] = useState(false);
  const paid = settings.engine === 'fal';
  const tall = project.aspect === '9:16';

  const mark = (id, text) => setBusy((b) => ({ ...b, [id]: text }));
  const fail = (id, text) => setErr((e) => ({ ...e, [id]: text }));
  const edit = (id, fn) => update((d) => { const s = d.shots.find((x) => x.id === id); if (s) fn(s); });
  const current = (id) => live().project.shots.find((x) => x.id === id);

  // Still prompt: style and cast lead so every frame shares a look.
  function framePrompt(s) {
    const pr = live().project;
    return [s.prompt, pr.cast && 'Characters: ' + pr.cast.replace(/\n+/g, '; '), pr.style].filter(Boolean).join('. ');
  }

  async function makeFrame(id) {
    const s = current(id);
    if (!s || !s.prompt.trim()) return fail(id, 'Write the shot description first.');
    fail(id, '');
    mark(id, 'Making frame');
    try {
      const st = live().settings;
      const args = { settings: st, prompt: framePrompt(s), aspect: live().project.aspect, onStatus: (t) => mark(id, 'Frame: ' + t) };
      const url = st.engine === 'fal' ? await falImage(args) : await hfImage(args);
      const frame = await toFrame(url);
      edit(id, (x) => { x.frame = frame; });
    } catch (e) {
      fail(id, e.message);
    }
    mark(id, '');
  }

  async function upload(id, file) {
    if (!file) return;
    fail(id, '');
    try {
      const frame = await toFrame(file);
      edit(id, (x) => { x.frame = frame; });
    } catch (e) {
      fail(id, e.message);
    }
  }

  async function makeClip(id) {
    let s = current(id);
    if (!s || !s.prompt.trim()) return fail(id, 'Write the shot description first.');
    const st = live().settings;
    fail(id, '');
    try {
      if (st.engine !== 'fal' && !s.frame) {
        await makeFrame(id);
        s = current(id);
        if (!s || !s.frame) return;
      }
      mark(id, 'Generating clip');
      const pr = live().project;
      const motion = [s.motion, s.frame ? '' : s.prompt, s.frame ? '' : pr.style].filter(Boolean).join('. ');
      const args = { settings: st, prompt: s.frame ? (s.motion || 'subtle natural motion') + '. ' + s.prompt : motion, frame: s.frame, aspect: pr.aspect, seconds: pr.seconds, onStatus: (t) => mark(id, 'Clip: ' + t) };
      const url = st.engine === 'fal' ? await falVideo(args) : await hfVideo(args);
      const clip = { id: uid(), url, engine: st.engine, at: Date.now() };
      edit(id, (x) => { x.clips.push(clip); x.pick = clip.id; });
    } catch (e) {
      fail(id, e.message);
    }
    mark(id, '');
  }

  async function makeAll() {
    setAll(true);
    for (const s of live().project.shots) {
      if (!current(s.id) || current(s.id).clips.length) continue;
      await makeClip(s.id);
    }
    setAll(false);
  }

  function move(i, by) {
    update((d) => {
      const j = i + by;
      if (j < 0 || j >= d.shots.length) return;
      const t = d.shots[i];
      d.shots[i] = d.shots[j];
      d.shots[j] = t;
    });
  }

  function remove(id) {
    if (confirm !== id) return setConfirm(id);
    update((d) => { d.shots = d.shots.filter((x) => x.id !== id); });
    setConfirm('');
  }

  const missing = project.shots.filter((s) => !s.clips.length).length;

  return (
    <>
      <section>
        <p className="mono">Step 02 / Shots</p>
        <h2>Generate the clips</h2>
        <p className="lede">Each shot gets a start frame, then the engine animates it. Regenerate until a take works, then pick it.</p>
        <div className="card">
          <p className="mono">Engine</p>
          <Chips options={[['free', 'Free, Hugging Face'], ['fal', 'Paid, fal.ai']]} value={settings.engine} onChange={(v) => updateSettings((s) => { s.engine = v; })} />
          <p className="note">
            {paid
              ? settings.fal ? 'Using your fal credit. Each clip is billed by fal.' : 'No fal key yet. Add it in Keys.'
              : settings.hf ? 'Using your free daily GPU quota. It covers a few clips a day.' : 'No Hugging Face token yet, so you share the anonymous quota, which runs out fast. Add a free token in Keys.'}
          </p>
          <div className="row">
            <button type="button" className="btn" disabled={all || !missing} onClick={makeAll}>{all ? 'Working through the list...' : missing ? 'Generate ' + missing + ' missing clip' + (missing > 1 ? 's' : '') : 'All shots have clips'}</button>
            <button type="button" className="btn sec" onClick={() => update((d) => { d.shots.push(newShot()); })}>Add shot</button>
          </div>
        </div>
      </section>

      <section>
        {!project.shots.length && <p className="muted">No shots yet. Write the shot list in Idea, or add a shot here.</p>}
        {project.shots.map((s, i) => {
          const clip = pickedClip(s);
          const working = busy[s.id];
          return (
            <div key={s.id} className="card">
              <div className="shot-head">
                <span className="rank">{(i < 9 ? '0' : '') + (i + 1)}</span>
                <input type="text" aria-label="Shot title" value={s.title} onChange={(e) => edit(s.id, (x) => { x.title = e.target.value; })} />
                <span className={'pill' + (s.clips.length ? ' good' : '')}>{s.clips.length ? s.clips.length + ' take' + (s.clips.length > 1 ? 's' : '') : 'No clip'}</span>
              </div>
              <Area label="What we see" value={s.prompt} onChange={(v) => edit(s.id, (x) => { x.prompt = v; })} placeholder="Wide shot of an old ferryman poling a narrow boat across a misty river at dawn" />
              <Field label="What moves" value={s.motion} onChange={(v) => edit(s.id, (x) => { x.motion = v; })} placeholder="the boat glides forward, slow push in" />

              <div className="frame">
                <div className={'thumb' + (tall ? ' tall' : '')}>{s.frame ? <img src={s.frame} alt={'Start frame for ' + s.title} /> : 'No frame'}</div>
                <div className="row">
                  <button type="button" className="btn ghost" disabled={!!working} onClick={() => makeFrame(s.id)}>{s.frame ? 'New frame' : 'Make frame'}</button>
                  <span className="btn ghost file">
                    Upload frame
                    <input type="file" accept="image/*" aria-label={'Upload a start frame for ' + s.title} onChange={(e) => { upload(s.id, e.target.files && e.target.files[0]); e.target.value = ''; }} />
                  </span>
                  {s.frame && <button type="button" className="btn ghost" onClick={() => edit(s.id, (x) => { x.frame = ''; })}>Clear</button>}
                </div>
              </div>

              <div className="row">
                <button type="button" className="btn" disabled={!!working} onClick={() => makeClip(s.id)}>{s.clips.length ? 'Generate another take' : 'Generate clip'}</button>
                {working && <span className="busy">{working}...</span>}
              </div>
              {err[s.id] && <p className="err">{err[s.id]}</p>}

              {clip && (
                <>
                  <video key={clip.id} src={clip.url} controls playsInline loop muted />
                  <div className="row">
                    {s.clips.length > 1 && s.clips.map((c, n) => (
                      <button key={c.id} type="button" className="chip" aria-pressed={clip.id === c.id} onClick={() => edit(s.id, (x) => { x.pick = c.id; })}>Take {n + 1}</button>
                    ))}
                    <a href={clip.url} target="_blank" rel="noopener noreferrer" download>Open clip</a>
                  </div>
                </>
              )}

              <div className="row between">
                <div className="row">
                  <button type="button" className="btn ghost" disabled={i === 0} onClick={() => move(i, -1)}>Move up</button>
                  <button type="button" className="btn ghost" disabled={i === project.shots.length - 1} onClick={() => move(i, 1)}>Move down</button>
                </div>
                <button type="button" className="btn ghost" onClick={() => remove(s.id)}>{confirm === s.id ? 'Tap again to delete' : 'Delete shot'}</button>
              </div>
            </div>
          );
        })}
        {project.shots.some((s) => s.clips.length) && (
          <div className="row">
            <button type="button" className="btn" onClick={() => go('film')}>Watch the film</button>
          </div>
        )}
      </section>
    </>
  );
}
