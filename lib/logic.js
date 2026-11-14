export function uid7() {
  return 'x' + Math.random().toString(36).slice(2, 9);
}

export function freshRate() {
  return { cur: '$', hour: 40, secs: 30, complexity: 2, rev: 2, usage: 'organic' };
}

export function fresh() {
  return { done: {}, lastDone: '', streak: 0, chars: [], saved: [], jobs: [], rate: freshRate(), updated: 0 };
}

export function freshProfile() {
  return { name: '', role: '', bio: '', skills: '', reels: [], updated: 0 };
}

export function lsGet(k) {
  try {
    return JSON.parse(window.localStorage.getItem(k));
  } catch (e) {
    return null;
  }
}

export function lsSet(k, v) {
  try {
    window.localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {}
}

export function okUrl(u) {
  return /^https?:\/\//i.test(String(u || '').trim());
}

function ymd(d) {
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}

export function today() {
  return ymd(new Date());
}

export function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return ymd(d);
}

// ISO week, used to rotate the weekly challenge.
export function weekNo() {
  const n = new Date();
  const t = new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const num = Math.ceil(((t - y) / 864e5 + 1) / 7);
  return { id: t.getUTCFullYear() + '-W' + num, n: num };
}

export function composePrompt(sp, chars) {
  const ch = (chars || []).find((c) => c.id === sp.char);
  const who = ch ? ch.desc.replace(/\.+$/, '') : sp.subject;
  const p = [];
  if (sp.video) {
    p.push((who || 'The subject') + ' ' + (sp.action || 'moves slowly'));
    p.push(sp.move);
    if (sp.mood) p.push(sp.mood + ' mood');
    return p.filter(Boolean).join(', ') + '.';
  }
  p.push(sp.size + ' of ' + (who || 'the subject') + (sp.action ? ' ' + sp.action : ''));
  if (sp.setting) p.push(sp.setting);
  p.push(sp.light);
  p.push(sp.lens);
  if (sp.mood) p.push(sp.mood + ' mood');
  return p.filter(Boolean).join(', ') + '.';
}

export function sheetPrompts(c) {
  const base = c.desc.replace(/\.+$/, '');
  return [
    'Face close up of ' + base + ', neutral expression, soft even light, plain grey backdrop, 85mm portrait lens.',
    'Front view, waist up, of ' + base + ', arms relaxed, soft even light, plain grey backdrop.',
    'Three quarter view, waist up, of ' + base + ', looking past camera, soft even light, plain grey backdrop.',
    'Full body standing view of ' + base + ', soft even light, plain grey backdrop, 50mm lens.',
  ];
}

export function quote(r) {
  const hours = ((Number(r.secs) || 0) / 10) * (Number(r.complexity) || 1) * 2 + (Number(r.rev) || 0) * 2;
  const fee = hours * (Number(r.hour) || 0) * (r.usage === 'paid ads' ? 1.5 : 1);
  return { hours: Math.round(hours), low: Math.round(fee * 0.8), mid: Math.round(fee), high: Math.round(fee * 1.2) };
}

export function quoteText(r) {
  const q = quote(r);
  const c = r.cur || '';
  return (
    'About ' + q.hours + ' hours of work\n' +
    'Quote: ' + c + q.mid + '\n' +
    'Range: ' + c + q.low + ' to ' + c + q.high + '\n' +
    'Includes ' + (Number(r.rev) || 0) + ' revision rounds. Extra rounds are billed.'
  );
}
