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
  const [sound, setSound] = useState(null);
  const player = useRef(null);
  const track = useRef(null);
  const idx = Math.min(at, Math.max(reel.length - 1, 0));

  useEffect(() => () => { if (file) URL.revokeObjectURL(file.url); }, [file]);
  useEffect(() => () => { if (sound) URL.revokeObjectURL(sound.url); }, [sound]);

  function next() {
    if (idx + 1 < reel.length) setAt(idx + 1);
    else {
      setAt(0);
      if (track.current) track.current.pause();
    }
  }

  useEffect(() => {
    const v = player.current;
    if (v && idx > 0) v.play().catch(() => {});
  }, [idx]);

  // Starts picture and soundtrack together from the first clip.
  function playAll() {
    setAt(0);
    setTimeout(() => {
      if (player.current) {
        player.current.currentTime = 0;
        player.current.play().catch(() => {});
      }
      if (track.current) {
        track.current.currentTime = 0;
        track.current.play().catch(() => {});
      }
    }, 150);
  }

  function pickSound(f) {
    if (!f) return;
    setSound({ blob: f, url: URL.createObjectURL(f), name: f.name });
  }

  async function exportFilm() {
    setBusy(true);
    setFile(null);
    setNote('Preparing');
    try {
      const out = await stitch(reel.map((x) => x.clip.url), project.aspect, setNote, sound ? sound.blob : null);
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
          <p className="lede">{reel.length} clip{reel.length > 1 ? 's' : ''} in order{missing ? ', ' + missing + ' shot' + (missing > 1 ? 's' : '') + ' still without a clip' : ''}. The clips play back to back.</p>
          <video ref={player} key={reel[idx].clip.id} src={reel[idx].clip.url} controls playsInline muted onEnded={next} />
          <p className="mono">Now showing {idx + 1} of {reel.length} / {reel[idx].shot.title}</p>
          <div className="row">
            <button type="button" className="btn" onClick={playAll}>{sound ? 'Play film with sound' : 'Play film from the start'}</button>
          </div>
          <div className="chips">
            {reel.map((x, i) => (
              <button key={x.clip.id} type="button" className="chip" aria-pressed={i === idx} onClick={() => setAt(i)}>{(i < 9 ? '0' : '') + (i + 1)}</button>
            ))}
          </div>

          <div className="card">
            <h4>Soundtrack</h4>
            <p className="note">The clips are silent. That is how the video model works. Add one audio file here, such as your recorded recitation or music, and it plays under the whole film and is included in the export.</p>
            <div className="row">
              <span className="btn sec file">
                {sound ? 'Change audio file' : 'Add audio file'}
                <input type="file" accept="audio/*" aria-label="Choose a soundtrack audio file" onChange={(e) => { pickSound(e.target.files && e.target.files[0]); e.target.value = ''; }} />
              </span>
              {sound && <button type="button" className="btn ghost" onClick={() => setSound(null)}>Remove</button>}
            </div>
            {sound && (
              <>
                <p className="mono">{sound.name}</p>
                <audio ref={track} src={sound.url} controls style={{ width: '100%' }} />
                <p className="note">The audio file stays on this device and is not saved with the project. Choose it again after reloading the page.</p>
              </>
            )}
          </div>

          <div className="card">
            <h4>Export one file</h4>
            <p className="note">Joins the clips{sound ? ' and the soundtrack' : ''} into a single video in your browser. It records in real time, so keep this tab open and the screen on.</p>
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
