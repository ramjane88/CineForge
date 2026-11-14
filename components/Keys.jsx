'use client';

import { freshSettings } from '../lib/project';
import { Chips, Field } from './ui';

export default function Keys({ p }) {
  const { settings, updateSettings } = p;
  const set = (k) => (v) => updateSettings((s) => { s[k] = v.trim(); });
  const d = freshSettings();

  return (
    <section>
      <p className="mono">Step 00 / Keys</p>
      <h2>Connect the engines</h2>
      <p className="lede">Keys are saved in this browser only. They pass through this app's server just long enough to reach the provider and are never stored there.</p>

      <div className="card">
        <h3>Free video engine</h3>
        <p className="note">Hugging Face gives every free account a small daily GPU quota, enough for a few short clips. Create a free read token at <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer">huggingface.co/settings/tokens</a>.</p>
        <Field label="Hugging Face token" type="password" value={settings.hf} onChange={set('hf')} placeholder="hf_..." autoComplete="off" />
      </div>

      <div className="card">
        <h3>Paid video engine</h3>
        <p className="note">fal.ai bills per clip from prepaid credit, with no daily cap. Create a key at <a href="https://fal.ai/dashboard/keys" target="_blank" rel="noopener noreferrer">fal.ai/dashboard/keys</a>.</p>
        <Field label="fal key" type="password" value={settings.fal} onChange={set('fal')} autoComplete="off" />
        <p className="mono">Resolution</p>
        <Chips options={[['480p', '480p, cheapest'], ['580p', '580p'], ['720p', '720p']]} value={settings.falRes} onChange={(v) => updateSettings((s) => { s.falRes = v; })} />
      </div>

      <div className="card">
        <h3>Shot writer</h3>
        <p className="note">Turns your idea into a shot list. Use Claude or Groq. If both are set, Claude is used. Claude writes text only. It cannot generate video, so clips always come from the video engines above.</p>
        <Field label="Claude API key" type="password" value={settings.claude} onChange={set('claude')} placeholder="sk-ant-..." autoComplete="off" />
        <p className="note">From <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer">console.anthropic.com</a>. This is billed per use and is separate from a Claude app subscription.</p>
        <Field label="Groq key" type="password" value={settings.groq} onChange={set('groq')} placeholder="gsk_..." autoComplete="off" />
        <p className="note">From <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer">console.groq.com/keys</a>.</p>
      </div>

      <div className="card">
        <details>
          <summary className="mono">Advanced: model ids</summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
            <p className="note">Change these when a provider renames or retires a model.</p>
            <Field label="Free video Space" value={settings.hfVideo} onChange={set('hfVideo')} />
            <Field label="Free image Space" value={settings.hfImage} onChange={set('hfImage')} />
            <Field label="fal text to video" value={settings.falT2V} onChange={set('falT2V')} />
            <Field label="fal image to video" value={settings.falI2V} onChange={set('falI2V')} />
            <Field label="fal image" value={settings.falImg} onChange={set('falImg')} />
            <div className="row">
              <button type="button" className="btn ghost" onClick={() => updateSettings((s) => { ['hfVideo', 'hfImage', 'falT2V', 'falI2V', 'falImg'].forEach((k) => { s[k] = d[k]; }); })}>Reset to defaults</button>
            </div>
          </div>
        </details>
      </div>
    </section>
  );
}
