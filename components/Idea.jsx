'use client';

import { useState } from 'react';
import { newShot } from '../lib/project';
import { writeShots } from '../lib/engines';
import { newOnly, parseScript } from '../lib/script';
import { Area, Chips, Field } from './ui';

export default function Idea({ p, go }) {
  const { project, settings, update, setAutoRun } = p;
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [paste, setPaste] = useState('');
  const [pasteNote, setPasteNote] = useState('');
  const set = (k) => (v) => update((d) => { d[k] = v; });

  async function breakDown() {
    if (!project.idea.trim()) return setNote('Write your idea first.');
    setBusy(true);
    setNote('Writing shots...');
    try {
      const shots = await writeShots({ key: settings.groq, claude: settings.claude, idea: project.idea, style: project.style, cast: project.cast, count: project.count, seconds: project.seconds });
      update((d) => { shots.forEach((s) => d.shots.push(newShot(s))); });
      setNote('');
      go('shots');
    } catch (e) {
      setNote(e.message);
    }
    setBusy(false);
  }

  // Shared by the script box and by a full script pasted into the idea field.
  function applyScript(got, runNow) {
    let added = 0;
    update((d) => {
      ['title', 'idea', 'cast', 'style', 'seconds'].forEach((k) => { if (got[k]) d[k] = got[k]; });
      const fresh = newOnly(got.shots, d.shots);
      added = fresh.length;
      fresh.forEach((s) => d.shots.push(newShot(s)));
    });
    if (got.shots.length) {
      if (runNow) setAutoRun(true);
      go('shots');
    }
    return added;
  }

  function importScript(runNow) {
    const got = parseScript(paste);
    if (!got.shots.length && !got.title && !got.idea) return setPasteNote('No shots found. Number each shot, for example: 1. Wide shot of a street at dusk');
    applyScript(got, runNow);
    setPaste('');
    setPasteNote('');
  }

  // A whole script pasted into the idea field is imported instead of being kept as one long idea.
  function setIdea(v) {
    if (v.length > 200) {
      const got = parseScript(v);
      if (got.shots.length >= 2) {
        if (!got.idea) got.idea = project.idea && project.idea.length < 200 ? project.idea : ' ';
        applyScript(got, false);
        return;
      }
    }
    set('idea')(v);
  }

  function blank() {
    update((d) => { d.shots.push(newShot()); });
    go('shots');
  }

  return (
    <>
    <section>
      <p className="mono">Step 01 / Idea</p>
      <h2>What is the film?</h2>
      <p className="lede">Describe it in a few lines. The shot writer turns it into a shot list, then each shot becomes a real clip.</p>
      <div className="card">
        <Field label="Title" value={project.title} onChange={set('title')} placeholder="The last ferry" />
        <Area label="Idea or script" rows={6} value={project.idea} onChange={setIdea} placeholder="An old ferryman makes his final crossing at dawn. Halfway over, he finds a child hiding under the bench..." />
        <Area label="Cast: one line per character, reused word for word in every shot" rows={3} value={project.cast} onChange={set('cast')} placeholder="Ferryman: a thin man in his seventies, white beard, faded blue shirt, straw hat" />
        <Field label="Visual style" value={project.style} onChange={set('style')} />
        <p className="mono">Frame</p>
        <Chips options={[['16:9', 'Wide 16:9'], ['9:16', 'Vertical 9:16']]} value={project.aspect} onChange={set('aspect')} />
        <div className="grid2">
          <Field label="Number of shots" type="number" min="1" max="16" value={project.count} onChange={(v) => set('count')(Math.min(Math.max(v, 1), 16))} />
          <Field label="Seconds per clip" type="number" min="2" max="5" value={project.seconds} onChange={(v) => set('seconds')(Math.min(Math.max(v, 2), 5))} />
        </div>
        <div className="row">
          <button type="button" className="btn" disabled={busy} onClick={breakDown}>{busy ? 'Writing...' : project.shots.length ? 'Write more shots' : 'Write the shot list'}</button>
          <button type="button" className="btn sec" onClick={blank}>Add a blank shot</button>
        </div>
        {note && <p className={busy ? 'busy' : 'err'}>{note}</p>}
        {!settings.groq && !settings.claude && <p className="note">The shot writer needs a Claude or Groq key. Add one in Keys, or write shots by hand.</p>}
      </div>
    </section>

    <section>
      <h2>Or paste a finished script</h2>
      <p className="lede">Paste a whole script, table and all. Title, idea, cast, style and every numbered shot are filled in for you. No key needed.</p>
      <div className="card">
        <Area label="Script" rows={6} value={paste} onChange={setPaste} placeholder={'Title: The Last Lamp\n| 1 | Wide shot of a village street at dusk | slow push in |\n| 2 | Close up of hands shaping clay | the wheel spins |'} />
        <div className="row">
          <button type="button" className="btn" disabled={!paste.trim()} onClick={() => importScript(true)}>Import and generate film</button>
          <button type="button" className="btn sec" disabled={!paste.trim()} onClick={() => importScript(false)}>Import only</button>
        </div>
        {pasteNote && <p className="err">{pasteNote}</p>}
      </div>
    </section>
    </>
  );
}
