'use client';

export function Field({ label, value, onChange, type = 'text', ...rest }) {
  return (
    <label className="f">
      {label}
      <input type={type} value={value} onChange={(e) => onChange(type === 'number' ? Number(e.target.value) || 0 : e.target.value)} {...rest} />
    </label>
  );
}

export function Area({ label, value, onChange, placeholder, rows }) {
  return (
    <label className="f">
      {label}
      <textarea value={value} rows={rows} placeholder={placeholder || ''} onChange={(e) => onChange(e.target.value)} />
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
