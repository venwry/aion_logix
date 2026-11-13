const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const id='external_product.apple_disk_ii';
const queue=JSON.parse(fs.readFileSync('data_storytelling/change.json')).change;
const proposal=queue.find(p=>p.elements.some(e=>e.record_id===id));
const after=proposal.elements.find(e=>e.record_id===id).after;
test('external product and standard impacts show relationship, safe prose and target navigation',async({page})=>{
 await page.route('**/data_foundation/external_products.json',async route=>{const doc=await(await route.fetch()).json();doc.external_product=doc.external_product.map(r=>r.id===id?after:r);await route.fulfill({json:doc});});
 await page.goto('/code/browser.html#'+id);await expect(page.locator('body')).toHaveAttribute('data-ready','true');
 const products=page.locator('#details [data-field="impacted_products"]');await expect(products.locator('.standard-impact')).toHaveCount(2);await expect(products.locator('.impact-relationship').first()).toHaveText('Relationship: competes with');
 await expect(products.locator('.specification-description > p')).toHaveCount(6);await expect(products).toContainText('Relation to product:');await expect(products.locator('.specification-unresolved')).toHaveCount(0);
 await products.getByRole('button').first().click();await expect(products.locator('table').first()).toBeVisible();
 await expect(page.locator('#details [data-field="impacted_standards"]')).toContainText('Relation to standard:');
 await products.locator('h3 a').first().click();await expect(page.locator('#details h2')).toContainText('FlexiDisk');
});
test('Changes confirm presents revised impact sections without writing foundation records',async({page})=>{
 const {snapshot}=await import('../server/model.js');const paths=['data_foundation','data_storytelling'].flatMap(d=>fs.readdirSync(d).filter(f=>f.endsWith('.json')&&f!=='authorization_decision.json').map(f=>d+'/'+f));const files=Object.fromEntries(paths.map(p=>[p,JSON.parse(fs.readFileSync(p))]));files['data_storytelling/change.json'].change=[proposal];
 await page.addInitScript(()=>sessionStorage.setItem('aion-backend',JSON.stringify({url:'https://aion-review-zu1t.onrender.com',token:'local-impact-test'})));
 await page.route('**/api/state',r=>r.fulfill({json:snapshot(files,'impact-fixture')}));await page.route('**/api/authorize',r=>r.abort());
 await page.goto('/code/changes-confirm.html#'+proposal.id);await expect(page.locator('body')).toHaveAttribute('data-ready','true');await page.getByLabel('Comparison',{exact:true}).selectOption('details');
 const next=page.locator('.comparison-column').nth(1);await expect(next.locator('.impacted-products')).toBeVisible();await expect(next.locator('.impacted-products')).toHaveClass(/changed-field/);await expect(next).toContainText('Relationship: supports');await expect(next.locator('.specification-unresolved')).toHaveCount(0);
});
