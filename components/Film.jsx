'use client';

import { useEffect, useRef, useState } from 'react';
import { pickedClip } from '../lib/project';
import { stitch } from '../lib/engines';

export default function Film({ p }) {
  const { project } = p;
  const reel = project.shots.map((s) => ({ shot: s, clip: pickedClip(s) })).filter((x) => x.clip);
  const [at, setAt] = useState(0);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState(null);
  const player = useRef(null);
  const idx = Math.min(at, Math.max(reel.length - 1, 0));

  useEffect(() => () => { if (file) URL.revokeObjectURL(file.url); }, [file]);

  function next() {
    if (idx + 1 < reel.length) setAt(idx + 1);
    else setAt(0);
  }

  useEffect(() => {
    const v = player.current;
    if (v && idx > 0) v.play().catch(() => {});
  }, [idx]);

  async function exportFilm() {
    setBusy(true);
    setFile(null);
    setNote('Preparing');
    try {
      const out = await stitch(reel.map((x) => x.clip.url), project.aspect, setNote);
      const name = (project.title || 'cineforge-film').replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.' + out.ext;
      setFile({ url: URL.createObjectURL(out.blob), name });
      setNote('');
    } catch (e) {
      setNote(e.message);
    }
    setBusy(false);
  }

  const missing = project.shots.length - reel.length;

  return (
    <section>
      <p className="mono">Step 03 / Film</p>
      <h2>{project.title || 'Your film'}</h2>
      {!reel.length && <p className="muted">No clips yet. Generate at least one in Shots.</p>}
      {!!reel.length && (
        <>
          <p className="lede">{reel.length} clip{reel.length > 1 ? 's' : ''} in order{missing ? ', ' + missing + ' shot' + (missing > 1 ? 's' : '') + ' still without a clip' : ''}. Press play to watch them back to back.</p>
          <video ref={player} key={reel[idx].clip.id} src={reel[idx].clip.url} controls playsInline muted onEnded={next} />
          <p className="mono">Now showing {idx + 1} of {reel.length} / {reel[idx].shot.title}</p>
          <div className="chips">
            {reel.map((x, i) => (
              <button key={x.clip.id} type="button" className="chip" aria-pressed={i === idx} onClick={() => setAt(i)}>{(i < 9 ? '0' : '') + (i + 1)}</button>
            ))}
          </div>
          <div className="card">
            <h4>Export one file</h4>
            <p className="note">Joins the clips into a single video in your browser. It records in real time, so keep this tab open. No sound is added.</p>
            <div className="row">
              <button type="button" className="btn" disabled={busy} onClick={exportFilm}>{busy ? 'Recording...' : 'Export film'}</button>
              {file && <a className="btn sec" href={file.url} download={file.name}>Save {file.name}</a>}
            </div>
            {note && <p className={busy ? 'busy' : 'err'}>{note}</p>}
          </div>
          <div className="card">
            <h4>Clips</h4>
            <p className="note">Links from the engines expire. Save the clips you want to keep.</p>
            {reel.map((x, i) => (
              <div key={x.clip.id} className="row between">
                <span>{(i < 9 ? '0' : '') + (i + 1)} {x.shot.title}</span>
                <a href={x.clip.url} target="_blank" rel="noopener noreferrer" download>Open</a>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
