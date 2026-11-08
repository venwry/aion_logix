const {test,expect}=require('@playwright/test');const fs=require('node:fs');
const read=p=>JSON.parse(fs.readFileSync(p));
const audit=read('docs/product-catalogue-phase3/migration-audit.json');
// Recover the reviewed proposal snapshots after author approvals as well as before.
const evidence=[...read('data_storytelling/authorization_decision.json').authorization_decision.map(d=>d.proposal).filter(Boolean),...read('data_storytelling/change.json').change];
const proposals=audit.proposals.map(a=>evidence.findLast(p=>p.id===a.change_id));
async function fixture(page){
 const manifest=read('data_storytelling/manifest.json').manifest[0];
 const documents=Object.fromEntries(manifest.foundation_datasets.map(type=>[type,read('data_foundation/'+(manifest.foundation_files?.[type]||type+'.json'))]));
 for(const p of proposals){expect(p).toBeTruthy();for(const e of p.elements){const rows=documents[e.record_type][e.record_type],i=rows.findIndex(r=>r.id===e.record_id);if(i<0)rows.push(e.before);else rows[i]=e.before;}}
 for(const [type,doc] of Object.entries(documents))await page.route('**/data_foundation/'+(manifest.foundation_files?.[type]||type+'.json'),r=>r.fulfill({json:doc}));
 await page.route('**/data_storytelling/change.json',r=>r.fulfill({json:{change:proposals}}));
 await page.route('**/data_storytelling/authorization.json',r=>r.fulfill({json:{authorization:[]}}));
 await page.route('**/data_storytelling/change_review.json',r=>r.fulfill({json:{change_review:[]}}));
}
async function ready(page,url){await fixture(page);await page.goto('/code/'+url);await expect(page.locator('body')).toHaveAttribute('data-ready','true');}
test('phase-3 external identities show pending authorization and separate software from physical delivery',async({page})=>{
 await ready(page,'browser.html#external_product.cpm_aurelia');await expect(page.locator('#dataset')).toHaveValue('external_product');
 await expect(page.locator('#details')).toContainText('Pending authorization');await expect(page.locator('#details')).toContainText('software owner and licensor');
 await expect(page.locator('#details')).toContainText('physical ROM cartridge is a separate offering');
 await page.locator('#search').fill('external_product.cpm_platform_extensions');await expect(page.locator('#rows tr')).toHaveCount(1);
 await page.locator('#rows tr').first().click();await expect(page.locator('#details h2')).toHaveText('DRI portable CP/M Platform Extensions');
});
test('all five phase-3 groups display current comparisons, deletions and the CP/M cartridge definition',async({page})=>{
 await ready(page,'changes-confirm.html');await expect(page.locator('#proposal-nav .proposal-nav-item')).toHaveCount(5);await expect(page.locator('#proposal-nav')).not.toContainText('Stale comparison');
 await page.locator('[data-change-id="change.catalogue_phase3_partners_and_cpm"].proposal-nav-item').click();
 await expect(page.locator('.change-table tbody tr')).toHaveCount(42);await expect(page.locator('.change-table')).toContainText('Record removed');
 await page.getByLabel('Comparison',{exact:true}).selectOption('details');
 const p=proposals.find(p=>p.id==='change.catalogue_phase3_partners_and_cpm'),i=p.elements.findIndex(e=>e.record_id==='product.software_cpm_aurelia');
 await page.getByLabel('Affected record',{exact:true}).selectOption(String(i));
 await expect(page.locator('.comparison-column').nth(1)).toContainText('Logix CP/M ROM cartridge for Aurelia');
 await expect(page.locator('.comparison-column').nth(1)).toContainText('device.rom_cartridge.cpm_aurelia');
 await expect(page.locator('.comparison-column').first()).toContainText('software_edition.cpm_aurelia');
 await expect(page.getByRole('button',{name:'Authorize and save',exact:true})).toBeDisabled();
});
