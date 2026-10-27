import {el, typeOf} from './shared.js';
import {decisionStore, digest, downloadLog} from './review-log.js';
export async function recordConfirmations(data) {
  const bar = el('div', 'review-toolbar');
  const message = el('span', '', 'Select a record to confirm its current content.');
  const warning = el('span', 'review-warning'); warning.setAttribute('role', 'status');
  const download = el('button', 'quiet-button', 'Download confirmation log');
  bar.append(message, download, warning);
  document.querySelector('#workspace').before(bar);
  const store = decisionStore('aion-record-confirmations-v1', text => warning.textContent = text);
  const eligible = data.records.filter(r => !['source', 'migration_map', 'reconciliation_issue', 'review_decision'].includes(typeOf(r)));
  const hashes = new Map(await Promise.all(eligible.map(async r => [r.id, await digest(r)])));
  let stale = 0;
  for (const [id, entry] of store.entries()) {
    if (!entry || entry.record_sha256 !== hashes.get(id) || data.index.get(id)?.status === 'confirmed') {
      store.set(id, null); stale++;
    }
  }
  if (stale) warning.textContent = `${stale} outdated selection(s) removed. Review the current record before confirming again.`;
  function selections() {
    return store.entries().filter(([id, e]) => hashes.get(id) === e.record_sha256).map(([id, e]) => ({
      action: 'confirm_record', record_id: id, record_type: typeOf(data.index.get(id)),
      previous_status: data.index.get(id).status, requested_status: 'confirmed',
      approved_at: e.approved_at, record_sha256: hashes.get(id), record: data.index.get(id)
    }));
  }
  function update() { const count = selections().length; message.textContent = `${count} record confirmation(s) selected · download and return the log in chat`; download.disabled = count === 0; }
  download.onclick = () => downloadLog('record-confirmations', selections(), {hash_algorithm:'SHA-256 of recursively key-sorted JSON, including the full current record'});
  update();
  return record => {
    if (!hashes.has(record.id)) return;
    const panel = el('div', 'confirmation-control');
    const label = el('label', 'review-check'); const box = el('input'); box.type = 'checkbox';
    box.checked = record.status === 'confirmed' || !!store.get(record.id);
    box.disabled = record.status === 'confirmed';
    label.append(box, document.createTextNode(record.status === 'confirmed' ? 'Already confirmed in the story' : 'I agree to set this record to confirmed'));
    panel.append(label, el('p', 'detail-caption', 'This confirms the current record, including its recorded occurrence or completion state. Download the log and return it in chat to update the repository.'));
    if (record.status === 'speculation') panel.append(el('p', 'detail-caption', 'Confirming this prediction adopts it as a baseline story fact.'));
    box.onchange = () => { store.set(record.id, box.checked ? {record_sha256:hashes.get(record.id), approved_at:new Date().toISOString()} : null); update(); };
    document.querySelector('#details .record-id').after(panel);
  };
}
