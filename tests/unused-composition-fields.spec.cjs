const {test,expect}=require('@playwright/test');const fs=require('node:fs');
const proposals=JSON.parse(fs.readFileSync('data_storytelling/review_evidence/unused-field-cleanup/proposals.json')).change;
for(const [type,id,omitted] of [['product','product.aurelia_mono','technical_definition'],['software_edition','software_edition.aionix','assembly_requirements']])test(type+' displays approved-cleanup composition without retired empty sections',async({page})=>{
 const after=proposals.flatMap(p=>p.elements).find(e=>e.record_id===id).after;
 await page.route('**/data_foundation/'+type+'.json',async route=>{const response=await route.fetch(),doc=await response.json();doc[type]=doc[type].map(r=>r.id===id?after:r);await route.fulfill({json:doc});});
 await page.goto('/code/browser.html#'+id);await expect(page.locator('body')).toHaveAttribute('data-ready','true');
 const history=page.locator('#details .composition-history');await expect(history.locator('[data-field="'+omitted+'"]')).toHaveCount(0);
 await expect(history.locator('[data-field="composition_definition"] table')).toBeVisible();
 await expect(history.locator('[data-field="composition_definition"] .column-title').filter({hasText:/^Requirements$/i})).toHaveCount(0);
});
