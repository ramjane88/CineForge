// Client side calls to the generation engines.
//   Shot writer: Claude or Groq, through /api/ai
//   Paid engine: fal.ai queue, through /api/fal
//   Free engine: public Hugging Face Spaces on ZeroGPU, called straight from the browser

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const NEGATIVE = 'blurry, low quality, distorted face, extra fingers, deformed hands, text, watermark, flicker';

/* ---------- shot writer ---------- */

export async function writeShots({ key, claude, idea, style, cast, count, seconds }) {
  const prompt =
    'You are a film director planning shots for an AI video model. Each clip is about ' + seconds + ' seconds, so each shot holds ONE simple visible action.\n' +
    'Break the idea below into exactly ' + count + ' shots that tell it in order.\n' +
    'Return ONLY a JSON array. Each item: {"title": short label, "prompt": one sentence describing the still frame with shot size, subject, action, setting and light, "motion": one short phrase for what moves and how the camera moves}.\n' +
    'Rules: describe recurring characters with the same words every time, taken from the cast notes. No dialogue. No text on screen. No markdown.\n\n' +
    'Visual style: ' + (style || 'cinematic') + '\n' +
    'Cast notes: ' + (cast || 'none given') + '\n' +
    'Idea: ' + idea;
  const res = await fetch('/api/ai', { method: 'POST', headers: { 'content-type': 'application/json', 'x-groq-key': key || '', 'x-anthropic-key': claude || '' }, body: JSON.stringify({ prompt, max: 1600 }) });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.text) throw new Error(j.error || 'The shot writer failed. Try again.');
  const a = j.text.indexOf('[');
  const b = j.text.lastIndexOf(']');
  if (a < 0 || b <= a) throw new Error('The shot writer did not return a list. Try again.');
  let arr;
  try {
    arr = JSON.parse(j.text.slice(a, b + 1));
  } catch (e) {
    throw new Error('The shot writer returned a broken list. Try again.');
  }
  const shots = arr.filter((x) => x && x.prompt).slice(0, 16).map((x) => ({ title: String(x.title || 'Shot').slice(0, 60), prompt: String(x.prompt), motion: String(x.motion || 'slow push in') }));
  if (!shots.length) throw new Error('The shot writer returned no shots. Try again.');
  return shots;
}

/* ---------- images in the browser ---------- */

export async function getBlob(url) {
  if (url.startsWith('data:') || url.startsWith('blob:')) return (await fetch(url)).blob();
  try {
    const r = await fetch(url);
    if (r.ok) return await r.blob();
  } catch (e) {}
  const r = await fetch('/api/media?url=' + encodeURIComponent(url));
  if (!r.ok) throw new Error('Could not download the generated file.');
  return r.blob();
}

// Shrinks any image to a JPEG data URL small enough to keep in the browser and send to an engine.
export async function toFrame(source, maxSide = 832) {
  const blob = source instanceof Blob ? source : await getBlob(source);
  const src = URL.createObjectURL(blob);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('That file is not an image the browser can read.'));
      i.src = src;
    });
    const k = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * k);
    c.height = Math.round(img.naturalHeight * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.82);
  } finally {
    URL.revokeObjectURL(src);
  }
}

/* ---------- paid engine: fal.ai ---------- */

async function fal(key, body) {
  if (!key) throw new Error('Add your fal key in the Keys tab.');
  const res = await fetch('/api/fal', { method: 'POST', headers: { 'content-type': 'application/json', 'x-fal-key': key }, body: JSON.stringify(body) });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || 'fal returned an error (' + res.status + ').');
  return j;
}

async function falRun(key, endpoint, input, onStatus) {
  const job = await fal(key, { op: 'submit', endpoint, input });
  if (!job.status_url || !job.response_url) throw new Error('fal did not accept the job.');
  for (let i = 0; i < 240; i++) {
    await sleep(3000);
    const s = await fal(key, { op: 'get', url: job.status_url });
    if (s.status === 'COMPLETED') return fal(key, { op: 'get', url: job.response_url });
    if (onStatus) onStatus(s.status === 'IN_QUEUE' ? 'In queue' : 'Rendering');
  }
  throw new Error('fal took longer than 12 minutes. Try again.');
}

export async function falImage({ settings, prompt, aspect, onStatus }) {
  const out = await falRun(settings.fal, settings.falImg, { prompt, image_size: aspect === '9:16' ? 'portrait_16_9' : 'landscape_16_9', num_images: 1 }, onStatus);
  const url = out && out.images && out.images[0] && out.images[0].url;
  if (!url) throw new Error('fal returned no image.');
  return url;
}

export async function falVideo({ settings, prompt, frame, aspect, onStatus }) {
  const input = frame
    ? { prompt, image_url: frame, resolution: settings.falRes }
    : { prompt, resolution: settings.falRes, aspect_ratio: aspect };
  const out = await falRun(settings.fal, frame ? settings.falI2V : settings.falT2V, input, onStatus);
  const url = out && out.video && out.video.url;
  if (!url) throw new Error('fal returned no video.');
  return url;
}

/* ---------- free engine: Hugging Face Spaces ---------- */

let GradioClient;

async function gradio() {
  if (!GradioClient) {
    // Loaded at run time from the CDN so the build has no dependency on it.
    const m = await import(/* webpackIgnore: true */ 'https://cdn.jsdelivr.net/npm/@gradio/client/dist/index.min.js');
    GradioClient = m.Client;
  }
  return GradioClient;
}

function clean(e) {
  const m = (e && (e.message || e.title || e.detail)) || String(e || '');
  const t = String(m).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (/quota|runs limit/i.test(t)) return 'Free GPU quota is used up for now. It resets about 24 hours after your first clip of the day.';
  return t.slice(0, 240) || 'The free engine failed. It may be busy. Try again.';
}

// Shared free Spaces drop connections often, so transient failures are retried.
// Quota errors are not: retrying cannot help and only wastes the wait.
async function space(id, token, api, data, onStatus) {
  const Client = await gradio().catch(() => {
    throw new Error('Could not load the free engine client. Check your connection.');
  });
  let last = 'The free engine failed. It may be busy. Try again.';
  for (let attempt = 1; attempt <= 3; attempt++) {
    if (attempt > 1) {
      if (onStatus) onStatus('Connection dropped, retry ' + attempt + ' of 3');
      await sleep(4000 * attempt);
    }
    try {
      const app = await Client.connect(id, token ? { token, hf_token: token } : {});
      const res = await app.predict(api, data);
      return res.data;
    } catch (e) {
      last = clean(e);
      if (/quota|runs limit/i.test(last)) break;
    }
  }
  const err = new Error(last);
  err.free = true;
  throw err;
}

function fileUrl(v) {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (v.video) return fileUrl(v.video);
  return v.url || '';
}

export async function hfImage({ settings, prompt, aspect, onStatus }) {
  const [w, h] = aspect === '9:16' ? [576, 1024] : [1024, 576];
  // Inputs of the FLUX.1 schnell Space: prompt, seed, randomize seed, width, height, steps.
  const d = await space(settings.hfImage, settings.hf, '/infer', [prompt, 0, true, w, h, 4], onStatus);
  const url = fileUrl(d && d[0]);
  if (!url) throw new Error('The free image engine returned nothing.');
  return url;
}

export async function hfVideo({ settings, prompt, frame, seconds, onStatus }) {
  if (!frame) throw new Error('The free engine animates a start frame. Make or upload a frame first.');
  const blob = await getBlob(frame);
  // Inputs of the Wan 2.2 Space: image, prompt, steps, negative prompt, seconds, guidance, guidance 2, seed, randomize seed.
  const d = await space(settings.hfVideo, settings.hf, '/generate_video', [blob, prompt, 6, NEGATIVE, Math.min(Number(seconds) || 4, 5), 1, 1, 42, true], onStatus);
  const url = fileUrl(d && d[0]);
  if (!url) throw new Error('The free video engine returned nothing.');
  return url;
}

/* ---------- film export ---------- */

// Plays the clips one after another onto a canvas and records it. Runs in real time.
export async function stitch(urls, aspect, onProgress) {
  if (typeof MediaRecorder === 'undefined') throw new Error('This browser cannot record video. Download the clips and join them in an editor.');
  const [W, H] = aspect === '9:16' ? [480, 854] : [854, 480];
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  const type = ['video/mp4;codecs=avc1.42E01E', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((t) => MediaRecorder.isTypeSupported(t));
  if (!type) throw new Error('This browser cannot record video. Download the clips and join them in an editor.');
  const rec = new MediaRecorder(canvas.captureStream(30), { mimeType: type, videoBitsPerSecond: 4000000 });
  const chunks = [];
  rec.ondataavailable = (e) => e.data && e.data.size && chunks.push(e.data);
  const stopped = new Promise((resolve) => (rec.onstop = resolve));
  rec.start(500);

  for (let i = 0; i < urls.length; i++) {
    if (onProgress) onProgress('Recording clip ' + (i + 1) + ' of ' + urls.length);
    const src = URL.createObjectURL(await getBlob(urls[i]));
    const v = document.createElement('video');
    v.muted = true;
    v.playsInline = true;
    v.src = src;
    await new Promise((resolve, reject) => {
      v.onloadeddata = resolve;
      v.onerror = () => reject(new Error('Clip ' + (i + 1) + ' could not be decoded by this browser.'));
    });
    const k = Math.max(W / v.videoWidth, H / v.videoHeight);
    const dw = v.videoWidth * k;
    const dh = v.videoHeight * k;
    await v.play();
    await new Promise((resolve) => {
      const draw = () => {
        ctx.drawImage(v, (W - dw) / 2, (H - dh) / 2, dw, dh);
        if (v.ended || v.paused) resolve();
        else requestAnimationFrame(draw);
      };
      v.onended = resolve;
      draw();
    });
    URL.revokeObjectURL(src);
  }

  rec.stop();
  await stopped;
  const ext = type.startsWith('video/mp4') ? 'mp4' : 'webm';
  return { blob: new Blob(chunks, { type: type.split(';')[0] }), ext };
}
