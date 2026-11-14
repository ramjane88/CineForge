'use client';

import { useState } from 'react';

export function Field({ label, value, onChange, type = 'text', ...rest }) {
  return (
    <label className="f">
      {label}
      <input type={type} value={value} onChange={(e) => onChange(type === 'number' ? Number(e.target.value) || 0 : e.target.value)} {...rest} />
    </label>
  );
}

export function Area({ label, value, onChange, placeholder }) {
  return (
    <label className="f">
      {label}
      <textarea value={value} placeholder={placeholder || ''} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function Select({ label, value, onChange, options }) {
  return (
    <label className="f">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Chips({ options, value, onChange }) {
  return (
    <div className="chips">
      {options.map(([k, label]) => (
        <button key={k} type="button" className="chip" aria-pressed={value === k} onClick={() => onChange(k)}>
          {label}
        </button>
      ))}
    </div>
  );
}

export function CopyButton({ text, label = 'Copy', className = 'btn ghost' }) {
  const [ok, setOk] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setOk(true);
      setTimeout(() => setOk(false), 1200);
    } catch (e) {}
  }
  return (
    <button type="button" className={className} onClick={copy}>
      {ok ? 'Copied' : label}
    </button>
  );
}

// Keyed AI calls so several boxes on a screen can run independently.
export function useAI(s) {
  const [ai, setAi] = useState({});
  const [busy, setBusy] = useState({});
  async function run(key, prompt) {
    if (busy[key]) return;
    setBusy((b) => ({ ...b, [key]: true }));
    setAi((a) => ({ ...a, [key]: 'Thinking...' }));
    const t = await s.ai(prompt);
    setAi((a) => ({ ...a, [key]: t }));
    setBusy((b) => ({ ...b, [key]: false }));
  }
  function say(key, t) {
    setAi((a) => ({ ...a, [key]: t }));
  }
  return { ai, busy, run, say };
}
