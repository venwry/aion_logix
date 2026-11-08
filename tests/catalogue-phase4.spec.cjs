const {test,expect}=require('@playwright/test');const fs=require('node:fs');
const read=p=>JSON.parse(fs.readFileSync(p));
const followup=read('data_storytelling/review_evidence/catalogue-phase4/remaining-feedback.json');
const evidence=[...read('data_storytelling/authorization_decision.json').authorization_decision.map(d=>d.proposal).filter(Boolean),...read('data_storytelling/change.json').change];
// Replay representative completed reviews alongside the current queue. Replaying
// all historical proposals would overlap later corrections to approved records.
const representativeIds=['change.catalogue_phase4_offer_software_cpm_aurelia_networking','change.catalogue_phase4_offer_software_aionix2','change.catalogue_phase4_offer_service_academy_customer_site'];
const proposals=[...followup.feedback_actions.map(f=>f.change_id),...representativeIds].map(id=>evidence.findLast(p=>p.id===id));
async function ready(page){
 const manifest=read('data_storytelling/manifest.json').manifest[0];
 const documents=Object.fromEntries(manifest.foundation_datasets.map(type=>[type,read('data_foundation/'+(manifest.foundation_files?.[type]||type+'.json'))]));
 for(const p of proposals){expect(p).toBeTruthy();for(const e of p.elements){const rows=documents[e.record_type][e.record_type],i=rows.findIndex(r=>r.id===e.record_id);if(e.before===null){if(i>=0)rows.splice(i,1);}else if(i<0)rows.push(e.before);else rows[i]=e.before;}}
 for(const [type,doc] of Object.entries(documents))await page.route('**/data_foundation/'+(manifest.foundation_files?.[type]||type+'.json'),r=>r.fulfill({json:doc}));
 await page.route('**/data_storytelling/change.json',r=>r.fulfill({json:{change:proposals}}));
 await page.route('**/data_storytelling/authorization.json',r=>r.fulfill({json:{authorization:[]}}));
 await page.route('**/data_storytelling/change_review.json',r=>r.fulfill({json:read('data_storytelling/change_review.json')}));
 await page.goto('/code/changes-confirm.html');await expect(page.locator('body')).toHaveAttribute('data-ready','true');
}
test('revised phase 4 shows reviewable decisions despite saved feedback on earlier hashes',async({page})=>{
 await ready(page);
 await expect(page.locator('#proposal-nav .proposal-nav-item')).toHaveCount(proposals.length);
 await expect(page.locator('#proposal-nav [data-change-id^="change.catalogue_phase4_offer_"]')).toHaveCount(proposals.filter(p=>p.id.startsWith('change.catalogue_phase4_offer_')).length);
 await expect(page.locator('#proposal-nav')).not.toContainText('Stale comparison');
 await expect(page.locator('#proposal-nav')).not.toContainText('Needs refinement');
 await page.locator('#proposal-nav [data-change-id="change.catalogue_phase4_offer_software_cpm_aurelia_networking"]').click();
 await expect(page.locator('.change-table tbody tr')).toHaveCount(3);
 await expect(page.locator('.dependency-note')).toHaveCount(0);
 await page.getByLabel('Comparison',{exact:true}).selectOption('details');
 await expect(page.locator('.comparison-column').nth(1)).toContainText('Logix CP/M networking ROM cartridge for Aurelia');
 await expect(page.locator('.comparison-column').nth(1)).toContainText('device.rom_cartridge.cpm_aurelia_networking');
 await expect(page.locator('.comparison-column').nth(1)).toContainText('campaign.ncc1981');
 await expect(page.locator('.comparison-column').nth(1)).toContainText('DRI software ownership');
});
test('phase 4 explains assumed service terms and gates shared launch cleanup',async({page})=>{
 await ready(page);
 await page.locator('#proposal-nav [data-change-id="change.catalogue_phase4_offer_service_professional_business_onsite"]').click();
 await page.getByLabel('Comparison',{exact:true}).selectOption('details');
 await expect(page.locator('.comparison-column').nth(1)).toContainText('1 year');
 await expect(page.locator('.comparison-column').nth(1)).toContainText('campaign.ncc1978');
 await expect(page.locator('.comparison-column').nth(1)).toContainText('449');
 await expect(page.locator('.comparison-column').nth(1)).toContainText('USD/year');
 await page.locator('#proposal-nav [data-change-id="change.catalogue_phase4_launch_reference_cleanup"]').click();
 await expect(page.locator('.dependency-note')).toContainText('change.catalogue_phase4_offer_software_entertainment_suite');
 await page.getByLabel('Comparison',{exact:true}).selectOption('json');
 await expect(page.locator('.change-table tbody tr')).toHaveCount(proposals.find(p=>p.id==='change.catalogue_phase4_launch_reference_cleanup').elements.length);
});


test('OS exchange exposes its cartridge BOM and courses expose location instead of a pseudo-product',async({page})=>{
 await ready(page);
 await page.locator('#proposal-nav [data-change-id="change.catalogue_phase4_offer_software_aionix2"]').click();
 await page.getByLabel('Comparison',{exact:true}).selectOption('details');
 await expect(page.locator('.comparison-column').nth(1)).toContainText('One cartridge exchange');
 await expect(page.locator('.comparison-column').nth(1)).toContainText('ComputerLand or Logix Computer Academy');
 const p=proposals.find(p=>p.id==='change.catalogue_phase4_offer_software_aionix2');
 await page.getByLabel('Affected record',{exact:true}).selectOption(String(p.elements.findIndex(e=>e.record_id==='device.athena.system_rom')));
 await expect(page.locator('.comparison-column').nth(1)).toContainText('Host-qualified carrier PCB and connector set');
 await expect(page.locator('.comparison-column').nth(1)).toContainText('software_edition.aionix2');
 await page.locator('#proposal-nav [data-change-id="change.catalogue_phase4_offer_service_academy_customer_site"]').click();
 const c=proposals.find(p=>p.id==='change.catalogue_phase4_offer_service_academy_customer_site');
 await page.getByLabel('Affected record',{exact:true}).selectOption(String(c.elements.findIndex(e=>e.record_id==='product.academy_course_2')));
 await expect(page.locator('.comparison-column').nth(1)).toContainText('5 days');
 await expect(page.locator('.comparison-column').nth(1)).toContainText('Academy facility or customer');
 await page.getByLabel('Comparison',{exact:true}).selectOption('json');
 await expect(page.locator('.change-table')).toContainText('Record removed');
});

test('remaining feedback exposes service prices and the corrected conference scope for review',async({page})=>{
 await ready(page);
 await page.getByLabel('Comparison',{exact:true}).selectOption('details');
 for(const [suffix,amounts] of [['service_customer_care',['49']],['service_professional_support',['249','299']]]){
  await page.locator('#proposal-nav [data-change-id="change.catalogue_phase4_offer_'+suffix+'"]').click();
  const after=page.locator('.comparison-column').nth(1);
  for(const amount of amounts)await expect(after).toContainText(amount);
  await expect(after).toContainText('USD/year');
  await expect(after).not.toContainText('Not yet specified');
 }
 const p=proposals.find(p=>p.id==='change.catalogue_phase4_launch_reference_cleanup');
 await page.locator('#proposal-nav [data-change-id="'+p.id+'"]').click();
 const select=async id=>page.getByLabel('Affected record',{exact:true}).selectOption(String(p.elements.findIndex(e=>e.record_id===id)));
 await select('event.ncc82_developer_sessions');
 await expect(page.locator('.comparison-column').nth(1)).toContainText('porting clinics');
 await expect(page.locator('.comparison-column').nth(1)).not.toContainText('745.23');
 await expect(page.locator('.comparison-column').nth(1)).not.toContainText('ncc_1982_campaign.json');
 await select('product.device_mono_pro_17');
 await expect(page.locator('.comparison-column').nth(0)).toContainText('campaign.ncc1982');
 await expect(page.locator('.comparison-column').nth(1)).toContainText('campaign.comdex1982');
 await expect(page.locator('.comparison-column').nth(1)).toContainText('event.autodesk_comdex');
 await select('process.ncc1982_campaign');
 await expect(page.locator('.comparison-column').nth(1)).toContainText('Public introduction');
 await expect(page.locator('.comparison-column').nth(1)).not.toContainText('product.device_mono_pro_17');
});
