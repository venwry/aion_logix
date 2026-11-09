const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const queue=JSON.parse(fs.readFileSync('data_storytelling/review_evidence/closeout-audit/feedback-amendment.json')).amendments.map(a=>a.after);
const assumption=queue.find(p=>p.id==='change.closeout_planning_source_cleanup').elements[0].after;
for(const pageName of ['browser','timeline'])test(pageName+' displays assumption topics and separate ordered statements',async({page})=>{
 await page.route('**/data_foundation/assumption.json',async route=>{
  const response=await route.fetch(),doc=await response.json();doc.assumption=doc.assumption.map(r=>r.id===assumption.id?assumption:r);await route.fulfill({json:doc});
 });
 await page.goto('/code/'+pageName+'.html#'+assumption.id);await expect(page.locator('body')).toHaveAttribute('data-ready','true');
 await expect(page.locator('#details h2')).toHaveText(assumption.topic);
 await expect(page.locator('#details .assumption-statements li')).toHaveCount(assumption.statements.length);
 await expect(page.locator('#details .assumption-statements li').first()).toHaveText(assumption.statements[0]);
});
test('revised review displays the horizon and remains authorizable with earlier feedback preserved',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const {snapshot}=await import('../server/model.js');
 const {datasetPath}=await import('../code/model-contract.js');
 const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(d=>fs.readdirSync(d).filter(f=>f.endsWith('.json')).map(f=>[d+'/'+f,JSON.parse(fs.readFileSync(d+'/'+f))])));
 // Pin the pending review fixture so future authorizations do not stale this test.
 files['data_storytelling/change.json'].change=queue;
 for(const p of queue)for(const e of p.elements){const rows=files[datasetPath(e.record_type)][e.record_type];rows[rows.findIndex(r=>r.id===e.record_id)]=e.before;}
 await page.addInitScript(()=>sessionStorage.setItem('aion-backend',JSON.stringify({url:'https://aion-review-zu1t.onrender.com',token:'local-feedback-test'})));
 await page.route('**/api/state',r=>r.fulfill({json:snapshot(files,'feedback-fixture')}));
 await page.route('**/api/authorize',r=>r.abort());
 await page.goto('/code/changes-confirm.html#change.closeout_dates_product');await expect(page.locator('body')).toHaveAttribute('data-ready','true');
 await expect(page.getByRole('button',{name:'Authorize',exact:true})).toBeEnabled();
 await page.getByLabel('Comparison',{exact:true}).selectOption('details');
 const columns=page.locator('.comparison-column');await expect(columns).toHaveCount(2);
 await expect(columns.nth(0).getByLabel('Composition history').locator('option').last()).toContainText('unknown');
 await expect(columns.nth(1).getByLabel('Composition history').locator('option').last()).toContainText('1995-01-01 · simulation end');
 await expect(page.getByText('Earlier feedback',{exact:false})).toBeVisible();
 expect(errors).toEqual([]);
});
