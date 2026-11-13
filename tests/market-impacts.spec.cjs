const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const response=JSON.parse(fs.readFileSync('data_foundation/market_response.json')).market_response[0];
const entry=(key,id)=>({[key]:id,direction:'mixed',description:'The {effect} affects adoption without guaranteed sales.',parameters:[{key:'effect',value:'<img src=x onerror=alert(1)>{effect}'}]});
const after={...response,impacted_standards:[entry('standard_id','technology.flexibus')],impacted_products:[entry('product_id','product.aurelia_mono'),entry('product_id','external_product.trs80_model_ii')]};
test('market impacts render standard/product names, safe highlighted parameters and navigation',async({page})=>{
 await page.route('**/data_foundation/market_response.json',async route=>{const doc=await(await route.fetch()).json();doc.market_response=doc.market_response.map(r=>r.id===response.id?after:r);await route.fulfill({json:doc});});
 await page.goto('/code/browser.html#'+response.id);await expect(page.locator('body')).toHaveAttribute('data-ready','true');
 const standards=page.locator('#details [data-field="impacted_standards"]'),products=page.locator('#details [data-field="impacted_products"]');
 await expect(standards.locator('.specification-chapter-heading')).toContainText('FlexiBUS');await expect(products.locator('.specification-chapter')).toHaveCount(2);
 await expect(standards.locator('.specification-parameter')).toHaveText('<img src=x onerror=alert(1)>{effect}');await expect(standards.locator('img')).toHaveCount(0);
 await expect(standards.locator('table')).toBeHidden();await standards.getByRole('button').click();await expect(standards.locator('table')).toBeVisible();
 await standards.locator('.specification-chapter-heading a').click();await expect(page.locator('#details h2')).toContainText('FlexiBUS');
});
test('Changes confirm compares new response sections without hiding legacy descriptions',async({page})=>{
 const {snapshot}=await import('../server/model.js');const paths=['data_foundation','data_storytelling'].flatMap(d=>fs.readdirSync(d).filter(f=>f.endsWith('.json')&&f!=='authorization_decision.json').map(f=>d+'/'+f));const files=Object.fromEntries(paths.map(p=>[p,JSON.parse(fs.readFileSync(p))]));
 const p={id:'change.test_market_impacts',category:'foundation',title:'Test impact rendering',reason:'Fixture',elements:[{record_type:'market_response',record_id:response.id,before:response,after}]};files['data_storytelling/change.json'].change=[p];
 await page.addInitScript(()=>sessionStorage.setItem('aion-backend',JSON.stringify({url:'https://aion-review-zu1t.onrender.com',token:'local-market-test'})));await page.route('**/api/state',r=>r.fulfill({json:snapshot(files,'market-fixture')}));await page.route('**/api/authorize',r=>r.abort());
 await page.goto('/code/changes-confirm.html#'+p.id);await expect(page.locator('body')).toHaveAttribute('data-ready','true');await page.getByLabel('Comparison',{exact:true}).selectOption('details');
 const cols=page.locator('.comparison-column');await expect(cols.nth(0).locator('[data-field="description"]')).toBeVisible();await expect(cols.nth(1).locator('[data-field="impacted_products"]')).toHaveClass(/changed-field/);await expect(cols.nth(1).locator('[data-field="impacted_standards"]')).toHaveClass(/changed-field/);
});
