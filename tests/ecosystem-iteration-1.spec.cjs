const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const proposals=JSON.parse(fs.readFileSync('data_storytelling/review_evidence/ecosystem-iteration-1/proposals.json')).change;
const id='external_product.model_ii_flexibus';
const impact={standard_id:'technology.flexibus',date:'1979-10',assumption_description:'The optional {board} reaches another platform.',comparison_description:'It uses {bus} without changing the base computer.',outcomes_description:'Adoption depends on {condition}.',parameters:[{key:'board',value:'expansion board'},{key:'bus',value:'technology.flexibus'},{key:'condition',value:'<img src=x onerror=alert(1)>{board}'}]};
async function migrated(page){
 for(const type of ['external_product','technology'])await page.route('**/data_foundation/'+(type==='external_product'?'external_products':type)+'.json',async route=>{
  const doc=await(await route.fetch()).json();doc[type]=doc[type].map(r=>structuredClone(proposals.flatMap(p=>p.elements).find(e=>e.record_id===r.id)?.after||r));
  if(type==='external_product')doc[type].find(r=>r.id===id).impacted_standards=[impact];
  await route.fulfill({json:doc});
 });
}
test('external specifications render like technologies and impacts have three safe paragraphs',async({page})=>{
 await migrated(page);await page.goto('/code/browser.html#'+id);await expect(page.locator('body')).toHaveAttribute('data-ready','true');
 const spec=page.locator('#details [data-field="specification"]');await expect(spec.locator('.specification-chapter-heading').first()).toContainText('Option seller');
 const card=page.locator('#details .standard-impact');await expect(card.locator('h3')).toContainText('FlexiBUS (1979-10)');
 await expect(card.locator('.specification-description > p')).toHaveCount(3);
 await expect(card.locator('strong')).toHaveText(['Base assumptions:','Relation to standard:','Commercial consequences:']);
 await expect(card.locator('.specification-parameter').first()).toHaveText('expansion board');
 await expect(card.locator('img')).toHaveCount(0);await expect(card).toContainText('<img src=x onerror=alert(1)>{board}');
 await expect(card.locator('table')).toBeHidden();await card.getByRole('button').click();await expect(card.locator('table')).toBeVisible();
 await expect(card.locator('.specification-description .reference-id')).toBeHidden();
 await card.locator('h3 a').click();await expect(page.locator('#details h2')).toHaveText('FlexiBUS');
});
test('legacy external specifications remain readable and navigable before approval',async({page})=>{
 await page.goto('/code/browser.html#'+id);await expect(page.locator('body')).toHaveAttribute('data-ready','true');
 const spec=page.locator('#details [data-field="specification"]');await expect(spec.locator('.specification-chapter')).not.toHaveCount(0);
 await expect(spec.locator('.specification-unresolved')).toHaveCount(0);
 const link=spec.locator('.specification-description a').first();await expect(link).toHaveAttribute('href','#actor.tandy');await link.click();await expect(page.locator('#details h2')).toContainText('Tandy');
});
test('Changes confirm shows converted specification and impact details safely',async({page})=>{
 const {snapshot}=await import('../server/model.js');
 const paths=['data_foundation','data_storytelling'].flatMap(d=>fs.readdirSync(d).filter(f=>f.endsWith('.json')&&f!=='authorization_decision.json').map(f=>d+'/'+f));
 const files=Object.fromEntries(paths.map(p=>[p,JSON.parse(fs.readFileSync(p))]));
 const proposal=structuredClone(proposals.find(p=>p.elements[0].record_id===id));proposal.elements[0].after.impacted_standards=[impact];files['data_storytelling/change.json'].change=[proposal];
 await page.addInitScript(()=>sessionStorage.setItem('aion-backend',JSON.stringify({url:'https://aion-review-zu1t.onrender.com',token:'local-ecosystem-test'})));
 await page.route('**/api/state',r=>r.fulfill({json:snapshot(files,'ecosystem-fixture')}));await page.route('**/api/authorize',r=>r.abort());
 await page.goto('/code/changes-confirm.html#'+proposal.id);await expect(page.locator('body')).toHaveAttribute('data-ready','true');await page.getByLabel('Comparison',{exact:true}).selectOption('details');
 const cols=page.locator('.comparison-column');await expect(cols.nth(0).locator('.technology-specification')).toBeVisible();await expect(cols.nth(1).locator('[data-field="specification"]')).toHaveClass(/changed-field/);
 await expect(cols.nth(1).locator('.impacted-standards')).toHaveClass(/changed-field/);await expect(cols.nth(1).locator('.standard-impact strong')).toHaveText(['Base assumptions:','Relation to standard:','Commercial consequences:']);
});
