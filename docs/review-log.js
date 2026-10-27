// Transport for author decisions. Canonical datasets are updated only after log review.
export function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  return value;
}
export async function digest(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(stable(value)));
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}
export function decisionStore(key, warning) {
  let values = {};
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) values = saved;
  } catch { warning('Saved selections could not be read. Please review and select again.'); }
  return {
    get: id => values[id],
    entries: () => Object.entries(values),
    set(id, value) {
      if (value) values[id] = value; else delete values[id];
      try { localStorage.setItem(key, JSON.stringify(values)); }
      catch { warning('Selections are available for this visit only. Download your log before leaving.'); }
    }
  };
}
export function downloadLog(kind, decisions, extra = {}) {
  const log = {
    format: 'aion-author-review', format_version: 1, repository: 'venwry/aion_logix',
    kind, exported_at: new Date().toISOString(), ...extra, decisions
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(log, null, 2) + '\n'], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `aion-${kind}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
