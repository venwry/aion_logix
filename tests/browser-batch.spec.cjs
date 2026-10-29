const {test,expect}=require('@playwright/test');const fs=require('node:fs');
const names=JSON.parse(fs.readFileSync('data_storytelling/manifest.json')).manifest[0].foundation_datasets;
const state=()=>({revision:'base123',collections:Object.fromEntries(names.map(n=>[n,JSON.parse(fs.readFileSync('data_foundation/'+n+'.json'))[n]])),authorization:[],changes:{change:[]}});
async function open(page){await page.addInitScript(()=>sessionStorage.setItem('aion-backend',JSON.stringify({url:location.origin,token:'test-key'})));await page.route('**/api/state',r=>r.fulfill({json:state()}));await page.goto('/code/browser.html');await expect(page.locator('body')).toHaveAttribute('data-ready','true');}
test('list selections survive filters and save in one request',async({page})=>{
 await open(page);const button=page.getByRole('button',{name:'Authorize and save',exact:true});await expect(button).toBeDisabled();
 const checks=page.locator('#rows input[type=checkbox]');const first=await checks.nth(0).getAttribute('aria-label');await checks.nth(0).check();await checks.nth(1).check();
 await page.locator('#dataset').selectOption('event');await checks.nth(0).check();await page.locator('#next').click();await checks.nth(0).check();
 await page.locator('#dataset').selectOption('actor');await expect(page.getByRole('checkbox',{name:first,exact:true})).toBeChecked();
 let calls=0,payload;await page.route('**/api/authorize',r=>{calls++;payload=r.request().postDataJSON();const s=state();s.authorization=payload.records.map(x=>({...x,state:'authorized'}));return r.fulfill({json:{...s,revision:'batch123456'}});});
 const save=page.getByRole('button',{name:'Authorize and save (4)',exact:true});const reset=page.getByRole('button',{name:'Reset filters'});expect((await save.boundingBox()).y).toBeLessThan((await reset.boundingBox()).y);
 await save.click();await expect(page.locator('#authorization-message')).toContainText('batch12');expect(calls).toBe(1);expect(payload.action).toBe('authorize_records');expect(payload.records).toHaveLength(4);await expect(page.getByRole('checkbox',{name:first,exact:true})).toHaveCount(0);await expect(button).toBeDisabled();
});
test('failed batch keeps all selections pending for review or retry',async({page})=>{
 await open(page);await page.locator('#rows input').nth(0).check();await page.locator('#rows input').nth(1).check();await page.route('**/api/authorize',r=>r.fulfill({status:409,json:{error:'A selected record has changed. Reload.'}}));await page.getByRole('button',{name:'Authorize and save (2)'}).click();await expect(page.locator('#authorization-message')).toContainText('has changed');await expect(page.locator('#rows input:checked')).toHaveCount(2);await expect(page.getByRole('button',{name:'Authorize and save (2)'})).toBeEnabled();
});
test('details use dotted fields and tables, with dataset link last',async({page})=>{
 await open(page);await page.goto('/code/browser.html#event.autodesk_agreement');await expect(page.locator('body')).toHaveAttribute('data-ready','true');
 await expect(page.locator('#details')).toContainText('time.value:');await expect(page.locator('#details')).toContainText('time.precision:');await expect(page.locator('#details .compact-value-table').first()).toContainText('actor_id');await expect(page.locator('#details details')).toHaveCount(0);await expect(page.locator('#details input[type=checkbox]')).toHaveCount(0);await expect(page.locator('#details > :last-child').getByRole('link',{name:'Open dataset ↗'})).toBeVisible();
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
