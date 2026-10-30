const {test,expect}=require('@playwright/test');const fs=require('node:fs');
const manifest={change:[{id:'change.test_review',category:'story',title:'John Walker review',reason:'Test proposal independent of the live review queue.',elements:[['actor','actor.john_walker'],['event','event.autodesk_agreement'],['agreement','agreement.autodesk_development']].map(([type,id])=>{const before=JSON.parse(fs.readFileSync('data_foundation/'+type+'.json'))[type].find(r=>r.id===id);return {record_type:type,record_id:id,before,after:{...before,[type==='actor'?'name':'title']:(before.name||before.title)+' reviewed'}};})}]};const names=JSON.parse(fs.readFileSync('data_storytelling/manifest.json')).manifest[0].foundation_datasets;
const state=()=>({revision:'base123456',collections:Object.fromEntries(names.map(n=>[n,JSON.parse(fs.readFileSync('data_foundation/'+n+'.json'))[n]])),authorization:[],changes:structuredClone(manifest)});
async function ready(page,path){await page.route('**/data_storytelling/change.json',r=>r.fulfill({json:manifest}));await page.goto('/code/'+path);await expect(page.locator('body')).toHaveAttribute('data-ready','true');}
async function connect(page){await page.addInitScript(()=>sessionStorage.setItem('aion-backend',JSON.stringify({url:'https://aion-review-zu1t.onrender.com',token:'test-key'})));await page.route('**/api/state',r=>r.fulfill({json:state()}));}
test('comparison is a visible Subject Before After table with no collapsed record sections',async({page})=>{await ready(page,'changes-confirm.html');await expect(page.locator('.change-table tbody tr')).toHaveCount(3);await expect(page.locator('.change-table')).toContainText('John Walker');await expect(page.locator('.change-table thead')).toHaveText('SubjectBeforeAfter');await expect(page.locator('#proposals details')).toHaveCount(0);await expect(page.getByRole('button',{name:/download/i})).toHaveCount(0);await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);});
test('proposal save authorizes the group and removes it from pending',async({page})=>{await connect(page);await page.route('**/api/authorize',r=>{const s=state();s.changes.change=[];return r.fulfill({json:{...s,revision:'saved123456'}});});await ready(page,'changes-confirm.html');await page.getByRole('checkbox',{name:'I authorize this change'}).check();await page.getByRole('button',{name:'Authorize and save'}).click();await expect(page.locator('#review-count')).toContainText('0 pending');await expect(page.locator('#warning')).toContainText('Saved and authorized');});

test('fixed service, filtered selections and one toolbar batch request',async({page})=>{
 const s=state();const first=s.changes.change[0];const allElements=first.elements;first.title='First proposal';first.elements=first.elements.slice(0,1);
 const second={...structuredClone(first),id:'change.second',title:'Second proposal',elements:[allElements[1]]};
 const third={...structuredClone(first),id:'change.third',title:'Third proposal',elements:[allElements[2]]};s.changes.change=[first,second,third];
 await connect(page);await page.route('**/api/state',r=>r.fulfill({json:s}));
 let calls=0,payload;await page.route('**/api/authorize',r=>{calls++;payload=r.request().postDataJSON();expect(r.request().url()).toBe('https://aion-review-zu1t.onrender.com/api/authorize');return r.fulfill({json:{...s,revision:'batchsaved',changes:{change:[third]}}});});
 await ready(page,'changes-confirm.html');
 await expect(page.getByRole('textbox',{name:'Backend URL'})).toHaveCount(0);
 await expect(page.locator('.fixed-service-url')).toHaveText('https://aion-review-zu1t.onrender.com');
 const save=page.getByRole('button',{name:'Authorize and save',exact:true});await expect(save).toHaveCount(1);await expect(save).toBeDisabled();
 const search=page.locator('#search');expect((await save.boundingBox()).x).toBeGreaterThan((await search.boundingBox()).x);
 await page.locator('[data-change-id="change.test_review"] input').check();await search.fill('Second proposal');
 await page.locator('[data-change-id="change.second"] input').check();await expect(page.locator('#selected-count')).toHaveText('2 selected');
 await save.click();expect(calls).toBe(1);expect(payload.action).toBe('approve_changes');expect(payload.changes.map(x=>x.change_id)).toEqual(['change.test_review','change.second']);
 await search.fill('');await expect(page.locator('.proposal-card')).toHaveCount(1);await expect(page.locator('#selected-count')).toHaveText('0 selected');
});
test('failed save preserves checkboxes and permits retry',async({page})=>{
 await connect(page);await page.route('**/api/authorize',r=>r.fulfill({status:409,json:{error:'A selected proposal has changed. Reload.'}}));
 await ready(page,'changes-confirm.html');const check=page.getByRole('checkbox',{name:'I authorize this change'});await check.check();
 await page.getByRole('button',{name:'Authorize and save'}).click();await expect(page.locator('#warning')).toContainText('has changed');
 await expect(check).toBeChecked();await expect(page.getByRole('button',{name:'Authorize and save'})).toBeEnabled();
});
test('connection form uses fixed service and does not reuse a key from another backend',async({page})=>{
 await page.addInitScript(()=>sessionStorage.setItem('aion-backend',JSON.stringify({url:'https://other.example',token:'other-key'})));
 let calls=0;await page.route('https://aion-review-zu1t.onrender.com/api/state',r=>{calls++;expect(r.request().headers().authorization).toBe('Bearer test-key');return r.fulfill({json:state()});});
 await ready(page,'changes-confirm.html');await expect(page.getByRole('textbox',{name:'Backend access key'})).toHaveValue('');
 await page.getByRole('textbox',{name:'Backend access key'}).fill('test-key');await page.getByRole('button',{name:'Connect',exact:true}).click();
 await expect(page.locator('body')).toHaveAttribute('data-ready','true');await expect.poll(()=>calls).toBeGreaterThanOrEqual(1);
});
