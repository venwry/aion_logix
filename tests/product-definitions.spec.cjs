const {test,expect}=require('@playwright/test');const fs=require('node:fs');
test('new technical datasets are browsable and pending authorization',async({page})=>{
 await page.route('**/data_storytelling/authorization.json',r=>r.fulfill({json:{authorization:[]}}));
 await page.goto('/code/browser.html#base_part.erav1_6mhz');await expect(page.locator('body')).toHaveAttribute('data-ready','true');
 await expect(page.locator('#details h2')).toHaveText('ERAv1 6MHz (initial)');await expect(page.locator('#details .badge')).toHaveText('Pending authorization');
 for(const n of ['base_part','device','software_edition'])await expect(page.locator('#dataset option[value="'+n+'"]').first()).toHaveCount(1);
 await page.locator('#dataset').selectOption('device');await page.locator('#search').fill('device.ram_64kb_x32');await page.locator('#rows tr[data-record-id="device.ram_64kb_x32"]').click();await expect(page.locator('#details h2')).toHaveText('Logix 64 KB 32-bit DRAM module');await expect(page.getByLabel('Composition history')).toBeVisible();await expect(page.locator('#details')).toContainText('unknown');
});
test('existing products have reviewable before and after compositions',async({page})=>{
 const pending=JSON.parse(fs.readFileSync('data_storytelling/change.json')).change,decisions=JSON.parse(fs.readFileSync('data_storytelling/authorization_decision.json')).authorization_decision;
 const proposal=[...pending,...decisions.map(d=>d.proposal).filter(Boolean)].find(p=>p.title==='Product definition — Logix Artemis 128 KB — Monochrome system');
 await page.route('**/data_storytelling/change.json',r=>r.fulfill({json:{change:[proposal]}}));
 await page.route('**/data_foundation/product.json',async route=>{const response=await route.fetch(),doc=await response.json();for(const e of proposal.elements){const i=doc.product.findIndex(r=>r.id===e.record_id);doc.product[i]=e.before;}await route.fulfill({json:doc});});
 await page.goto('/code/changes-confirm.html');await expect(page.locator('body')).toHaveAttribute('data-ready','true');
 await page.locator('#search').fill('Product definition — Logix Artemis 128 KB — Monochrome system');
 await expect(page.locator('.proposal-card')).toHaveCount(1);await expect(page.locator('.change-table')).toContainText('composition_history');
 await expect(page.getByRole('button',{name:'Authorize',exact:true})).toHaveCount(1);
});
