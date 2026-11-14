// Turns a pasted script into project fields and shots, with no AI involved.
// Understands "Title: ...", "Idea: ...", "Cast: ...", "Style: ..." lines,
// table rows such as "| 1 | what we see | what moves |" (pipes or tabs),
// and numbered lines such as "1. what we see".
export function parseScript(text) {
  const out = { shots: [] };
  const secs = String(text || '').match(/(\d+)\s*seconds?\s+(?:each|per)/i) || String(text || '').match(/clip length to (\d+)/i);
  if (secs) out.seconds = Math.min(Math.max(Number(secs[1]), 2), 5);
  const strip = (s) => s.replace(/\*\*/g, '').replace(/^[>\s]+/, '').trim();
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = strip(raw);
    if (!line) continue;
    const field = line.match(/^(title|idea|cast|style)\s*:\s*(.+)$/i);
    if (field) {
      out[field[1].toLowerCase()] = field[2].trim();
      continue;
    }
    const sep = line.includes('|') ? '|' : line.includes('\t') ? '\t' : '';
    if (sep) {
      const cells = line.split(sep).map((c) => c.trim());
      while (cells.length && cells[0] === '') cells.shift();
      while (cells.length && cells[cells.length - 1] === '') cells.pop();
      if (cells.length >= 2 && /^\d+$/.test(cells[0]) && cells[1]) out.shots.push({ title: 'Shot ' + cells[0], prompt: cells[1], motion: cells[2] || 'slow push in' });
      continue;
    }
    const n = line.match(/^(?:shot\s*)?(\d+)\s*[.):]\s*(.+)$/i);
    if (n) out.shots.push({ title: 'Shot ' + n[1], prompt: n[2].trim(), motion: 'slow push in' });
  }
  return out;
}
