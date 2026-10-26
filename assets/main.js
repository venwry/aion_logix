import { marked } from 'marked';
import DOMPurify from 'dompurify';
import mermaid from 'mermaid';
mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'neutral', flowchart: { htmlLabels: false } });
const entries = [
  { id: 'principles', title: 'Zasady modelu danych', path: 'DATA_MODEL_PRINCIPLES.md', type: 'md' },
  { id: 'guide', title: 'Jak korzystać z pracowni', path: 'README.md', type: 'md' },
  { id: 'prototype', title: 'Interaktywny przykład', path: 'examples/interactive.html', type: 'html' },
  { id: 'data', title: 'Przykładowy zbiór danych', path: 'examples/actor.json', type: 'json' },
];
const $ = id => document.getElementById(id);
let current, mode = 'preview', request = 0, renderId = 0;
function code(text) { const pre = document.createElement('pre'); const el = document.createElement('code'); el.textContent = text; pre.append(el); return pre; }
function tree(value, label = 'Dane') {
  if (value !== null && typeof value === 'object') {
    const details = document.createElement('details'); details.open = true;
    const summary = document.createElement('summary'); summary.textContent = `${label} ${Array.isArray(value) ? '[' : '{'}${Object.keys(value).length}${Array.isArray(value) ? ']' : '}'}`; details.append(summary);
    const children = document.createElement('div'); children.className = 'tree';
    for (const [key, child] of Object.entries(value)) children.append(tree(child, key));
    details.append(children); return details;
  }
  const row = document.createElement('div'); row.className = 'value'; row.textContent = `${label}: ${JSON.stringify(value)}`; return row;
}
async function render() {
  const version = ++renderId; const host = $('content'); host.replaceChildren(); $('status').textContent = '';
  $('preview').setAttribute('aria-pressed', String(mode === 'preview'));
  $('source').setAttribute('aria-pressed', String(mode === 'source'));
  if (!current) return;
  if (mode === 'source') { host.append(code(current.text)); return; }
  try {
    if (current.type === 'md') {
      const article = document.createElement('article');
      article.innerHTML = DOMPurify.sanitize(marked.parse(current.text)); host.append(article);
      for (const block of article.querySelectorAll('code.language-mermaid')) {
        try {
          const { svg } = await mermaid.render(`diagram-${version}-${Math.random().toString(36).slice(2)}`, block.textContent);
          if (version !== renderId) return;
          const diagram = document.createElement('div'); diagram.className = 'diagram';
          diagram.innerHTML = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } }); block.parentElement.replaceWith(diagram);
        } catch { if (version === renderId) $('status').textContent = 'Nie udało się narysować diagramu. Zachowano jego kod.'; }
      }
    } else if (current.type === 'json') host.append(tree(JSON.parse(current.text)));
    else if (current.type === 'html' || current.type === 'js') {
      const frame = document.createElement('iframe'); frame.title = current.title; frame.setAttribute('sandbox', 'allow-scripts');
      const policy = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; form-action 'none'">`;
      // Prototypes are self-contained. JS runs as a script with no access to the host origin.
      frame.srcdoc = policy + (current.type === 'js' ? '<body><script>' + current.text.replace(/<\/script/gi, '<\\/script') + '</script></body>' : current.text);
      host.append(frame);
    }
  } catch (error) { $('status').textContent = `Błąd podglądu: ${error.message}`; host.append(code(current.text)); }
}
async function select() {
  const entry = entries.find(item => item.id === location.hash.slice(1)) || entries[0]; const version = ++request;
  current = null; ++renderId; $('content').replaceChildren(); $('title').textContent = entry.title; $('status').textContent = 'Ładowanie…';
  for (const link of $('navigation').children) { if (link.hash === '#' + entry.id) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current'); }
  try {
    const response = await fetch(entry.path); if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text(); if (version !== request) return;
    current = { ...entry, text }; $('kind').textContent = entry.type.toUpperCase(); await render();
  } catch (error) { if (version === request) $('status').textContent = `Nie można wczytać pliku: ${error.message}. Uruchom witrynę przez serwer HTTP.`; }
}
for (const entry of entries) { const link = document.createElement('a'); link.href = '#' + entry.id; link.textContent = entry.title; $('navigation').append(link); }
$('preview').onclick = () => { mode = 'preview'; render(); };
$('source').onclick = () => { mode = 'source'; render(); };
$('file').onchange = async event => {
  const file = event.target.files[0]; if (!file) return; const version = ++request;
  const extension = file.name.split('.').pop().toLowerCase(); const type = ({ markdown: 'md', htm: 'html' })[extension] || extension;
  if (!['md', 'html', 'json', 'js'].includes(type)) { $('status').textContent = 'Obsługiwane formaty: MD, HTML, JS i JSON.'; return; }
  const text = await file.text(); if (version !== request) return;
  current = { title: file.name, text, type }; $('title').textContent = file.name; $('kind').textContent = `${type.toUpperCase()} · PLIK LOKALNY`;
  for (const link of $('navigation').children) link.removeAttribute('aria-current'); mode = 'preview'; render();
};
window.addEventListener('hashchange', select); select();
