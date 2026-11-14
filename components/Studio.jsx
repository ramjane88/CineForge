'use client';

import { useState } from 'react';
import { SIZES, LENSES, LIGHTS, MOVES } from '../lib/content';
import { composePrompt, sheetPrompts, uid7 } from '../lib/logic';
import { Area, Chips, CopyButton, Field, Select, useAI } from './ui';

export default function Studio({ s, go }) {
  const [sp, setSp] = useState({ subject: '', action: '', setting: '', size: SIZES[1], lens: LENSES[1], light: LIGHTS[0], mood: '', move: MOVES[1], char: '', video: false });
  const [raw, setRaw] = useState('');
  const [nc, setNc] = useState({ name: '', desc: '' });
  const { ai, busy, run, say } = useAI(s);
  const set = (k) => (v) => setSp((x) => ({ ...x, [k]: v }));
  const out = composePrompt(sp, s.me.chars);

  function save() {
    s.updateMe((m) => {
      m.saved.unshift({ id: uid7(), title: (sp.video ? 'Clip: ' : 'Frame: ') + (sp.action || sp.subject || 'untitled').slice(0, 40), text: out });
    });
    go('prompts');
  }

  function direct() {
    const t = raw.trim();
    if (!t) return say('direct', 'Paste a prompt first.');
    run(
      'direct',
      'You are a cinematographer. Rewrite the loose AI image prompt below as one planned shot. Use this order: shot size, subject with concrete details, action, setting, light source and direction, lens, mood. Remove empty quality words such as 8k, masterpiece, ultra detailed. Plain text, no markdown, no dashes.\n\nFormat:\nDIRECTED PROMPT:\n<one paragraph under 60 words>\n\nWHAT CHANGED:\n<three short lines>\n\nLoose prompt:\n' + t
    );
  }

  function addChar() {
    if (!nc.name.trim() || !nc.desc.trim()) return;
    s.updateMe((m) => m.chars.push({ id: uid7(), name: nc.name.trim(), desc: nc.desc.trim() }));
    setNc({ name: '', desc: '' });
  }

  return (
    <>
      <section>
        <p className="mono">Station 02 / Studio</p>
        <h2>Prompt director</h2>
        <p className="lede">Build a shot from decisions, not adjectives. Copy the result into any image or video generator.</p>
        <div className="card">
          <Chips options={[['still', 'Still frame'], ['clip', 'Motion clip']]} value={sp.video ? 'clip' : 'still'} onChange={(k) => set('video')(k === 'clip')} />
          <label className="f">
            Locked character
            <select value={sp.char} onChange={(e) => set('char')(e.target.value)}>
              <option value="">None, describe below</option>
              {s.me.chars.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          {!sp.char && <Field label="Subject" value={sp.subject} onChange={set('subject')} placeholder="an old fisherman with a grey beard" />}
          <Field label="Action" value={sp.action} onChange={set('action')} placeholder="mending a net" />
          {sp.video ? (
            <Select label="Camera" value={sp.move} onChange={set('move')} options={MOVES} />
          ) : (
            <>
              <Field label="Setting" value={sp.setting} onChange={set('setting')} placeholder="on a wooden pier at low tide" />
              <div className="grid2">
                <Select label="Shot size" value={sp.size} onChange={set('size')} options={SIZES} />
                <Select label="Lens" value={sp.lens} onChange={set('lens')} options={LENSES} />
              </div>
              <Select label="Light" value={sp.light} onChange={set('light')} options={LIGHTS} />
            </>
          )}
          <Field label="Mood" value={sp.mood} onChange={set('mood')} placeholder="quiet" />
          <div className="out">{out}</div>
          <div className="row">
            <CopyButton text={out} label="Copy prompt" className="btn" />
            <button type="button" className="btn sec" onClick={save}>Save to my prompts</button>
          </div>
        </div>
      </section>

      <section>
        <h2>Fix a random prompt</h2>
        <p className="lede">Paste any loose prompt. The director rewrites it as a planned shot and tells you what changed.</p>
        <div className="card">
          <Area label="Your prompt" value={raw} onChange={setRaw} placeholder="cinematic epic warrior, ultra detailed, 8k, masterpiece" />
          <div className="row">
            <button type="button" className="btn" disabled={!!busy.direct} onClick={direct}>Direct it</button>
          </div>
          {ai.direct && <div className="ai">{ai.direct}</div>}
        </div>
      </section>

      <section>
        <h2>Character lock</h2>
        <p className="lede">One descriptor, used word for word, keeps a face consistent. Each character gets four sheet prompts.</p>
        {s.me.chars.map((c, i) => (
          <div key={c.id} className="card">
            <div className="row between">
              <h3>{c.name}</h3>
              <button type="button" className="btn ghost" onClick={() => { if (sp.char === c.id) set('char')(''); s.updateMe((m) => m.chars.splice(i, 1)); }}>Remove</button>
            </div>
            <Area label="Descriptor" value={c.desc} onChange={(v) => s.updateMe((m) => { m.chars[i].desc = v; })} />
            <details>
              <summary className="mono">Sheet prompts</summary>
              <div className="out">{sheetPrompts(c).join('\n\n')}</div>
              <div className="row" style={{ marginTop: 8 }}>
                <CopyButton text={sheetPrompts(c).join('\n\n')} label="Copy all four" />
              </div>
            </details>
          </div>
        ))}
        <div className="card">
          <h4>Add a character</h4>
          <Field label="Name" value={nc.name} onChange={(v) => setNc((x) => ({ ...x, name: v }))} />
          <Area label="Descriptor: age, build, face, hair, wardrobe, signature object" value={nc.desc} onChange={(v) => setNc((x) => ({ ...x, desc: v }))} placeholder="a woman in her thirties, lean build, sharp cheekbones, short black hair, grey wool coat, silver ring on the left hand" />
          <div className="row">
            <button type="button" className="btn sec" onClick={addChar}>Lock character</button>
          </div>
        </div>
      </section>
    </>
  );
}
