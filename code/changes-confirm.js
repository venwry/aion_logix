import {el, $, human, loadData, showError} from './shared.js';
import {stable, digest, decisionStore, downloadLog} from './review-log.js';
// Provenance stays in snapshots and exports, but is omitted from the story comparison.
function visible(value) {
  if (Array.isArray(value)) return value.map(visible);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([k]) => k !== 'source_refs').map(([k,v]) => [k,visible(v)]));
  return value;
}
function changedFields(before, after) {
  if (before === null || after === null) return [visible(before), visible(after)];
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(k => JSON.stringify(stable(before[k])) !== JSON.stringify(stable(after[k])) && k !== 'source_refs');
  return [before, after].map(record => Object.fromEntries(keys.map(k => [k, Object.hasOwn(record,k) ? visible(record[k]) : '(not present)'])));
}
try {
  const response = await fetch('../docs/review/proposals.json');
  if (!response.ok) throw new Error('Could not load the review proposals.');
  const manifest = await response.json();
  const data = await loadData();
  const store = decisionStore('aion-change-approvals-v1', text => $('warning').textContent = text);
  const proposals = manifest.change;
  if (manifest.metadata.applied_summary) { const notice=el('p','',manifest.metadata.applied_summary); const link=el('a','',' View application report');link.href='../docs/review/history/2026-10-27/APPLICATION_REPORT.md';notice.append(link);$('questions').before(notice); }
  const hashes = new Map(await Promise.all(proposals.map(async p => [p.id, await digest(p)])));
  const blocked = new Map();
  const schemas = new Map();
  for (const p of proposals) {
    for (const e of p.elements) {
      let current;
      if (e.record_type === 'schema') {
        if (!schemas.has(e.record_id)) {
          const res = await fetch('../schemas/'+e.record_id+'.schema.json');
          if (!res.ok) throw new Error('Could not verify the current '+e.record_id+' schema.');
          schemas.set(e.record_id, await res.json());
        }
        current = e.path.split('/').slice(1).reduce((v,k) => v?.[k.replaceAll('~1','/').replaceAll('~0','~')], schemas.get(e.record_id)) ?? null;
      } else current = data.index.get(e.record_id) ?? null;
      if (JSON.stringify(stable(current)) !== JSON.stringify(stable(e.before))) blocked.set(p.id, 'The current record or schema has changed since this proposal. A refreshed proposal is required.');
    }
  }
  let removed=0;
  for (const [id,saved] of store.entries()) if (!saved || saved.proposal_sha256 !== hashes.get(id) || blocked.has(id)) {store.set(id,null);removed++;}
  if (removed) $('warning').textContent = `${removed} outdated selection(s) removed. Please review the updated proposals.`;
  function selected() { return proposals.filter(p => !!store.get(p.id) && !blocked.has(p.id)); }
  function updateCount() { $('review-count').textContent = `${selected().length} approved · ${proposals.length} proposals`; $('download').disabled = !selected().length; }
  $('download').onclick = () => downloadLog('change-approvals', selected().map(p => ({
    action:p.category === 'schema' ? 'approve_schema_extension' : 'approve_change',
    change_id:p.id, approved_at:store.get(p.id).approved_at, proposal_sha256:hashes.get(p.id), proposal:p
  })), {baseline_commit:manifest.metadata.baseline_commit, hash_algorithm:'SHA-256 of recursively key-sorted JSON, including the full proposal'});
  const questions = el('details','review-questions'); questions.append(el('summary','','Open story questions · '+manifest.metadata.questions.length));
  for (const question of manifest.metadata.questions) {const item=el('p');item.append(el('strong','',question.question),el('span','',' '+question.reason));questions.append(item);}
  if (manifest.metadata.questions.length) $('questions').append(questions);
  function render() {
    $('proposals').replaceChildren();
    const query = $('search').value.trim().toLowerCase();
    const matches = proposals.filter(p => (!$('category').value || p.category === $('category').value) && (!$('selection').value || Boolean(store.get(p.id)) === ($('selection').value === 'selected')) && (!query || JSON.stringify(visible(p)).toLowerCase().includes(query)));
    for (const p of matches) {
      const card = el('article','proposal-card');card.dataset.changeId=p.id;
      card.append(el('span','type-tag',p.category === 'schema' ? 'Schema extension' : 'Story change'), el('h2','',p.title), el('p','',p.reason));
      const label=el('label','review-check');const check=el('input');check.type='checkbox';check.checked=!!store.get(p.id);check.disabled=blocked.has(p.id);
      label.append(check,document.createTextNode(p.category === 'schema' ? 'Approve this schema extension' : 'Approve this change'));card.append(label);
      if(blocked.has(p.id))card.append(el('p','review-warning',blocked.get(p.id)));
      check.onchange=()=>{store.set(p.id,check.checked?{proposal_sha256:hashes.get(p.id),approved_at:new Date().toISOString()}:null);updateCount();if($('selection').value)render();};
      for (const element of p.elements) {
        const section=el('details','proposal-element');
        section.append(el('summary','',human(element.record_type)+' · '+element.record_id+(element.path?' · '+element.path:'')));
        let built=false;
        section.ontoggle=()=>{
          if (!section.open || built) return;built=true;
          const pair = element.record_type === 'schema' ? [element.before,element.after] : changedFields(element.before,element.after);
          const columns=el('div','compare-grid');
          pair.forEach((value,i)=>{const column=el('section','compare-column');column.append(el('h3','',i?'After':'Before'),el('pre','',value===null?(i?'Record removed':'Not present — new element'):JSON.stringify(value,null,2)));columns.append(column);});
          section.append(columns);
          if(element.example){section.append(el('h3','','Example after approval'),el('pre','',JSON.stringify(element.example,null,2)));}
          if(element.record_type!=='schema'){
            const full=el('details');full.append(el('summary','','Full before / after records (source references hidden)'));
            full.append(el('pre','',JSON.stringify({before:visible(element.before),after:visible(element.after)},null,2)));section.append(full);
          }
        };
        card.append(section);
      }
      $('proposals').append(card);
    }
    if (!matches.length) $('proposals').append(el('p','empty-state','No proposals match these filters.'));
    updateCount();
  }
  $('category').onchange=render;$('selection').onchange=render;$('search').oninput=render;
  render();document.body.dataset.ready='true';
} catch (error) { showError(error.message); }
