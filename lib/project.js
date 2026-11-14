'use client';

import { useEffect, useRef, useState } from 'react';

const LSP = 'cineforge-film-v2';
const LSK = 'cineforge-keys-v2';

export const uid = () => 'x' + Math.random().toString(36).slice(2, 9);

export function freshProject() {
  return { title: '', idea: '', style: 'cinematic, natural light, 35mm lens, shallow depth of field', cast: '', aspect: '16:9', seconds: 4, count: 6, shots: [] };
}

export function freshSettings() {
  return {
    claude: '',
    groq: '',
    fal: '',
    hf: '',
    engine: 'auto',
    falT2V: 'fal-ai/wan/v2.2-a14b/text-to-video',
    falI2V: 'fal-ai/wan/v2.2-a14b/image-to-video',
    falImg: 'fal-ai/flux/schnell',
    falRes: '480p',
    hfVideo: 'zerogpu-aoti/wan2-2-fp8da-aoti-faster',
    hfImage: 'black-forest-labs/FLUX.1-schnell',
  };
}

export function newShot(x) {
  return { id: uid(), title: (x && x.title) || 'New shot', prompt: (x && x.prompt) || '', motion: (x && x.motion) || 'slow push in', frame: '', clips: [], pick: '' };
}

function read(k) {
  try {
    return JSON.parse(window.localStorage.getItem(k));
  } catch (e) {
    return null;
  }
}

function write(k, v) {
  try {
    window.localStorage.setItem(k, JSON.stringify(v));
    return true;
  } catch (e) {
    return false;
  }
}

// The whole film lives in the browser: project, shots, start frames and clip links.
export function useProject() {
  const [project, setProject] = useState(freshProject);
  const [settings, setSettings] = useState(freshSettings);
  const [full, setFull] = useState(false);
  const ref = useRef({ project: freshProject(), settings: freshSettings() });

  useEffect(() => {
    const p = Object.assign(freshProject(), read(LSP) || {});
    const s = Object.assign(freshSettings(), read(LSK) || {});
    ref.current = { project: p, settings: s };
    setProject(p);
    setSettings(s);
  }, []);

  function update(fn) {
    const next = JSON.parse(JSON.stringify(ref.current.project));
    fn(next);
    ref.current.project = next;
    setProject(next);
    setFull(!write(LSP, next));
  }

  function updateSettings(fn) {
    const next = { ...ref.current.settings };
    fn(next);
    ref.current.settings = next;
    setSettings(next);
    write(LSK, next);
  }

  // Latest values for long running async work, where the render closure is stale.
  const live = () => ref.current;

  return { project, settings, update, updateSettings, live, full };
}

export function pickedClip(shot) {
  return shot.clips.find((c) => c.id === shot.pick) || shot.clips[shot.clips.length - 1] || null;
}
