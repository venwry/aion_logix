const {test,expect}=require('@playwright/test');const fs=require('node:fs');
test('discussion accepts remarks and withdrawal but cannot authorize or show empty comparisons',async({page})=>{
 const {snapshot,transact,records}=await import('../server/model.js');let files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(d=>fs.readdirSync(d).filter(f=>f.endsWith('.json')).map(f=>[d+'/'+f,JSON.parse(fs.readFileSync(d+'/'+f))])));
 const actor=records(files)[0],editions=records(files).filter(r=>r.id.startsWith('software_edition.')).slice(0,18);
 const concrete={id:'change.discussion_ui_concrete',category:'foundation',title:'Concrete name clarification',reason:'Isolated UI fixture.',elements:[{record_type:actor.id.split('.')[0],record_id:actor.id,before:actor,after:{...actor,name:actor.name+' clarified'}}]},discussion={id:'change.discussion_ui_problem',category:'discussion',title:'Unknown software versions',reason:'Choose the representation for missing versions.',elements:[],affected_record_ids:editions.map(r=>r.id),findings:editions.map(r=>({record_id:r.id,path:'/version',description:'The literal \"None\" needs an explicit unknown representation.'}))};
 files['data_storytelling/change.json'].change=[discussion,concrete];const before=JSON.stringify(records(files));const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>sessionStorage.setItem('aion-backend',JSON.stringify({url:'https://aion-review-zu1t.onrender.com',token:'local-discussion-test'})));
 await page.route('**/api/state',r=>r.fulfill({json:snapshot(files,'discussion-base')}));
 await page.route('**/api/authorize',async r=>{files=transact(files,r.request().postDataJSON()).files;await r.fulfill({json:snapshot(files,'discussion-saved')});});
 await page.goto('/code/changes-confirm.html');await expect(page.locator('body')).toHaveAttribute('data-ready','true');
 await expect(page.getByRole('button',{name:'Authorize',exact:true})).toBeDisabled();await expect(page.getByLabel('Comparison',{exact:true})).toBeHidden();await expect(page.locator('.change-table')).toHaveCount(0);
 await page.getByText('Findings (18)',{exact:true}).click();await expect(page.locator('.discussion-findings')).toContainText('literal "None"');
 await page.getByRole('button',{name:'Add remarks',exact:true}).click();await page.getByLabel('Refinement feedback').fill('Represent unknown software versions explicitly; do not invent releases.');await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page.locator('#warning')).toContainText('Review decisions saved');await expect(page.getByLabel('Refinement feedback')).toHaveAttribute('readonly','');expect(JSON.stringify(records(files))).toBe(before);
 await page.locator('#category').selectOption('foundation');await expect(page.locator('.proposal-nav-item')).toHaveCount(1);await expect(page.getByLabel('Comparison',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Authorize',exact:true})).toBeEnabled();
 await page.getByLabel('Comparison',{exact:true}).selectOption('details');await expect(page.locator('.comparison-column')).toHaveCount(2);
 await page.locator('#category').selectOption('discussion');await expect(page.getByLabel('Comparison',{exact:true})).toBeHidden();await expect(page.getByLabel('Affected record',{exact:true})).toHaveCount(0);await page.getByRole('button',{name:'Remove',exact:true}).click();await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page.locator('#review-count')).toHaveText('1 pending proposal(s)');
 expect(JSON.stringify(records(files))).toBe(before);expect(files['data_storytelling/authorization_decision.json'].authorization_decision.at(-1).target).toEqual([]);expect(errors).toEqual([]);
});
test('documentation exposes the current catalogue contract and feedback datasets',async({page})=>{
 await page.goto('/docs/viewer.html#catalogue-validation');
 await expect(page.locator('article h1')).toHaveText('Catalogue validation');
 await expect(page.locator('article')).toContainText('opt-in');
 await expect(page.locator('article')).toContainText('Discussion');
 await expect(page.getByRole('link',{name:'Storytelling · annotation',exact:true})).toBeVisible();
 await expect(page.getByRole('link',{name:'Storytelling · change review',exact:true})).toBeVisible();
 await expect(page.getByRole('status')).toBeEmpty();
});
