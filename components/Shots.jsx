'use client';

import { useEffect, useState } from 'react';
import { newShot, pickedClip, uid } from '../lib/project';
import { falImage, falVideo, hfImage, hfVideo, toFrame } from '../lib/engines';
import { parseScript } from '../lib/script';
import { Area, Chips, Field } from './ui';

export default function Shots({ p, go }) {
  const { project, settings, update, updateSettings, live } = p;
  const [busy, setBusy] = useState({});
  const [err, setErr] = useState({});
  const [confirm, setConfirm] = useState('');
  const [all, setAll] = useState(false);
  const [allNote, setAllNote] = useState('');
  const [splitNote, setSplitNote] = useState('');
  const tall = project.aspect === '9:16';

  const mark = (id, text) => setBusy((b) => ({ ...b, [id]: text }));
  const fail = (id, text) => setErr((e) => ({ ...e, [id]: text }));
  const edit = (id, fn) => update((d) => { const s = d.shots.find((x) => x.id === id); if (s) fn(s); });
  const current = (id) => live().project.shots.find((x) => x.id === id);

  // A whole script pasted into one shot box is split into separate shot cards.
  function setPrompt(id, v) {
    if (v.length > 200) {
      const got = parseScript(v);
      if (got.shots.length >= 2) {
        update((d) => {
          ['title', 'idea', 'cast', 'style', 'seconds'].forEach((k) => { if (got[k]) d[k] = got[k]; });
          const i = d.shots.findIndex((x) => x.id === id);
          if (i < 0) return;
          Object.assign(d.shots[i], { title: got.shots[0].title, prompt: got.shots[0].prompt, motion: got.shots[0].motion, frame: '' });
          d.shots.splice(i + 1, 0, ...got.shots.slice(1).map(newShot));
        });
        setSplitNote('That was a full script, so it was split into ' + got.shots.length + ' shot cards.');
        return;
      }
    }
    edit(id, (x) => { x.prompt = v; });
  }

  // 'auto' tries the free engine first and falls back to fal when it fails and a fal key exists.
  async function run(id, free, paidFn, args) {
    const st = live().settings;
    if (st.engine === 'fal') return { url: await paidFn(args), engine: 'fal' };
    try {
      return { url: await free(args), engine: 'free' };
    } catch (e) {
      if (st.engine !== 'auto' || !st.fal) throw e;
      mark(id, 'Free engine failed, switching to paid');
      return { url: await paidFn(args), engine: 'fal' };
    }
  }

  // Still prompt: style and cast lead so every frame shares a look.
  function framePrompt(s) {
    const pr = live().project;
    return [s.prompt, pr.cast && 'Characters: ' + pr.cast.replace(/\n+/g, '; '), pr.style].filter(Boolean).join('. ');
  }

  // Each maker reports 'ok', 'quota' or 'fail' so a batch run knows when to stop.
  async function makeFrame(id) {
    const s = current(id);
    if (!s || !s.prompt.trim()) {
      fail(id, 'Write the shot description first.');
      return 'fail';
    }
    fail(id, '');
    mark(id, 'Making frame');
    let result = 'ok';
    try {
      const st = live().settings;
      const args = { settings: st, prompt: framePrompt(s), aspect: live().project.aspect, onStatus: (t) => mark(id, 'Frame: ' + t) };
      const made = await run(id, hfImage, falImage, args);
      const frame = await toFrame(made.url);
      edit(id, (x) => { x.frame = frame; });
    } catch (e) {
      fail(id, e.message);
      result = /quota/i.test(e.message) ? 'quota' : 'fail';
    }
    mark(id, '');
    return result;
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
    if (!s || !s.prompt.trim()) {
      fail(id, 'Write the shot description first.');
      return 'fail';
    }
    const st = live().settings;
    fail(id, '');
    if (st.engine !== 'fal' && !s.frame) {
      const framed = await makeFrame(id);
      if (framed !== 'ok') return framed;
      s = current(id);
      if (!s || !s.frame) return 'fail';
    }
    let result = 'ok';
    mark(id, 'Generating clip');
    try {
      const pr = live().project;
      const prompt = s.frame
        ? (s.motion || 'subtle natural motion') + '. ' + s.prompt
        : [s.prompt, s.motion, pr.cast && 'Characters: ' + pr.cast.replace(/\n+/g, '; '), pr.style].filter(Boolean).join('. ');
      const args = { settings: st, prompt, frame: s.frame, aspect: pr.aspect, seconds: pr.seconds, onStatus: (t) => mark(id, 'Clip: ' + t) };
      const made = await run(id, hfVideo, falVideo, args);
      const clip = { id: uid(), url: made.url, engine: made.engine, at: Date.now() };
      edit(id, (x) => { x.clips.push(clip); x.pick = clip.id; });
    } catch (e) {
      fail(id, e.message);
      result = /quota/i.test(e.message) ? 'quota' : 'fail';
    }
    mark(id, '');
    return result;
  }

  // Works down the list. Stops at the first quota error, since every later shot would hit it too.
  async function makeAll() {
    setAll(true);
    setAllNote('');
    let made = 0;
    for (const s of live().project.shots) {
      const cur = current(s.id);
      if (!cur || cur.clips.length) continue;
      const r = await makeClip(s.id);
      if (r === 'ok') made += 1;
      if (r === 'quota') {
        const left = live().project.shots.filter((x) => !x.clips.length).length;
        setAllNote('Free quota ran out after ' + made + ' clip' + (made === 1 ? '' : 's') + '. ' + left + ' still to make. They need tomorrow\'s quota, or a fal key in Keys to finish now.');
        break;
      }
    }
    setAll(false);
    const shots = live().project.shots;
    if (shots.length && shots.every((x) => x.clips.length)) go('film');
  }

  // Frames cost a fraction of a clip, so drafting every frame first is the cheap way to check a film.
  async function framesAll() {
    setAll(true);
    setAllNote('');
    for (const s of live().project.shots) {
      const cur = current(s.id);
      if (!cur || cur.frame || cur.clips.length) continue;
      const r = await makeFrame(s.id);
      if (r === 'quota') {
        setAllNote('Free quota ran out while making frames. Switch Engine to Paid only to finish them.');
        break;
      }
    }
    setAll(false);
  }

  // Set by "Import and generate film" on the Idea tab.
  useEffect(() => {
    if (!p.autoRun) return;
    p.setAutoRun(false);
    makeAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.autoRun]);

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
          <Chips options={[['auto', 'Free first, then paid'], ['free', 'Free only'], ['fal', 'Paid only']]} value={settings.engine} onChange={(v) => updateSettings((s) => { s.engine = v; })} />
          <p className="note">
            {settings.engine === 'fal'
              ? settings.fal ? 'Every clip uses your fal credit. Reliable, billed per clip.' : 'No fal key yet. Add it in Keys.'
              : settings.engine === 'auto'
                ? settings.fal ? 'Tries the free engine, retries dropped connections, then uses your fal credit if it still fails.' : 'Tries the free engine and retries dropped connections. Add a fal key in Keys and failed clips will switch to paid on their own.'
                : 'Free shared GPUs only. Expect a small daily quota and occasional failures.'}
            {settings.engine !== 'fal' && !settings.hf ? ' No Hugging Face token yet, so the quota is the tiny anonymous one.' : ''}
          </p>
          <div className="row">
            <button type="button" className="btn" disabled={all || !missing} onClick={makeAll}>{all ? 'Working through the list...' : missing ? 'Generate ' + missing + ' missing clip' + (missing > 1 ? 's' : '') : 'All shots have clips'}</button>
            <button type="button" className="btn sec" disabled={all || !project.shots.some((x) => !x.frame && !x.clips.length)} onClick={framesAll}>Draft all frames first</button>
            <button type="button" className="btn sec" onClick={() => update((d) => { d.shots.push(newShot()); })}>Add shot</button>
          </div>
          <p className="note">To save credit, draft the frames first. A frame costs a small fraction of a clip, so fix the picture there, then generate clips only for frames you like.</p>
          {allNote && <p className="err">{allNote}</p>}
          {splitNote && <p className="note">{splitNote}</p>}
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
              <Area label="What we see" value={s.prompt} onChange={(v) => setPrompt(s.id, v)} placeholder="Wide shot of an old ferryman poling a narrow boat across a misty river at dawn" />
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
