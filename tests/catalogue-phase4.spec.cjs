const {test,expect}=require('@playwright/test');const fs=require('node:fs');
const read=p=>JSON.parse(fs.readFileSync(p));
const audit=read('data_storytelling/review_evidence/catalogue-phase4/audit.json');
const evidence=[...read('data_storytelling/authorization_decision.json').authorization_decision.map(d=>d.proposal).filter(Boolean),...read('data_storytelling/change.json').change];
const proposals=audit.proposals.map(a=>evidence.findLast(p=>p.id===a.change_id));
async function ready(page){
 const manifest=read('data_storytelling/manifest.json').manifest[0];
 const documents=Object.fromEntries(manifest.foundation_datasets.map(type=>[type,read('data_foundation/'+(manifest.foundation_files?.[type]||type+'.json'))]));
 for(const p of proposals){expect(p).toBeTruthy();for(const e of p.elements){const rows=documents[e.record_type][e.record_type],i=rows.findIndex(r=>r.id===e.record_id);if(i<0)rows.push(e.before);else rows[i]=e.before;}}
 for(const [type,doc] of Object.entries(documents))await page.route('**/data_foundation/'+(manifest.foundation_files?.[type]||type+'.json'),r=>r.fulfill({json:doc}));
 await page.route('**/data_storytelling/change.json',r=>r.fulfill({json:{change:proposals}}));
 await page.route('**/data_storytelling/authorization.json',r=>r.fulfill({json:{authorization:[]}}));
 await page.route('**/data_storytelling/change_review.json',r=>r.fulfill({json:{change_review:[]}}));
 await page.goto('/code/changes-confirm.html');await expect(page.locator('body')).toHaveAttribute('data-ready','true');
}
test('phase 4 presents 30 independent offerings and preserves licensed cartridge definition',async({page})=>{
 await ready(page);
 await expect(page.locator('#proposal-nav .proposal-nav-item')).toHaveCount(39);
 await expect(page.locator('#proposal-nav [data-change-id^="change.catalogue_phase4_offer_"]')).toHaveCount(30);
 await expect(page.locator('#proposal-nav')).not.toContainText('Stale comparison');
 await page.locator('[data-change-id="change.catalogue_phase4_offer_software_cpm_aurelia_networking"]').click();
 await expect(page.locator('.change-table tbody tr')).toHaveCount(1);
 await expect(page.locator('.dependency-note')).toHaveCount(0);
 await page.getByLabel('Comparison',{exact:true}).selectOption('details');
 await expect(page.locator('.comparison-column').nth(1)).toContainText('Logix CP/M networking ROM cartridge for Aurelia');
 await expect(page.locator('.comparison-column').nth(1)).toContainText('device.rom_cartridge.cpm_aurelia_networking');
 await expect(page.locator('.comparison-column').nth(1)).toContainText('campaign.ncc1981');
 await expect(page.locator('.comparison-column').nth(1)).toContainText('DRI software ownership');
});
test('phase 4 explains assumed service terms and gates shared launch cleanup',async({page})=>{
 await ready(page);
 await page.locator('[data-change-id="change.catalogue_phase4_offer_service_professional_business_onsite"]').click();
 await page.getByLabel('Comparison',{exact:true}).selectOption('details');
 await expect(page.locator('.comparison-column').nth(1)).toContainText('remain to be specified');
 await expect(page.locator('.comparison-column').nth(1)).toContainText('campaign.ncc1978');
 await page.locator('[data-change-id="change.catalogue_phase4_launch_reference_cleanup"]').click();
 await expect(page.locator('.dependency-note')).toContainText('change.catalogue_phase4_offer_software_entertainment_suite');
 await page.getByLabel('Comparison',{exact:true}).selectOption('json');
 await expect(page.locator('.change-table tbody tr')).toHaveCount(5);
});
