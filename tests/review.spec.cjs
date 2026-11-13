const {test,expect}=require('@playwright/test');const fs=require('node:fs');
const manifest={change:[{id:'change.test_review',category:'story',title:'John Walker review',reason:'Test proposal independent of the live review queue.',elements:[['actor','actor.john_walker'],['event','event.autodesk_agreement'],['agreement','agreement.autodesk_development']].map(([type,id])=>{const before=JSON.parse(fs.readFileSync('data_foundation/'+type+'.json'))[type].find(r=>r.id===id);return {record_type:type,record_id:id,before,after:{...before,[type==='actor'?'name':'title']:(before.name||before.title)+' reviewed'}};})}]};const foundationManifest=JSON.parse(fs.readFileSync('data_storytelling/manifest.json')).manifest[0],names=foundationManifest.foundation_datasets;
const state=()=>({revision:'base123456',collections:Object.fromEntries(names.map(n=>[n,JSON.parse(fs.readFileSync('data_foundation/'+(foundationManifest.foundation_files?.[n]||n+'.json')))[n]])),authorization:[],changes:structuredClone(manifest)});
async function ready(page,path){await page.route('**/data_storytelling/change.json',r=>r.fulfill({json:manifest}));await page.goto('/code/'+path);await expect(page.locator('body')).toHaveAttribute('data-ready','true');}
async function connect(page){await page.addInitScript(()=>sessionStorage.setItem('aion-backend',JSON.stringify({url:'https://aion-review-zu1t.onrender.com',token:'test-key'})));await page.route('**/api/state',r=>r.fulfill({json:state()}));}
test('comparison is a visible Subject Before After table with no collapsed record sections',async({page})=>{await ready(page,'changes-confirm.html');await expect(page.locator('.change-table tbody tr')).toHaveCount(3);await expect(page.locator('.change-table')).toContainText('John Walker');await expect(page.locator('.change-table thead')).toHaveText('SubjectBeforeAfter');await expect(page.locator('#proposals details')).toHaveCount(0);await expect(page.getByRole('button',{name:/download/i})).toHaveCount(0);await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);});
test('proposal save authorizes the group and removes it from pending',async({page})=>{await connect(page);await page.route('**/api/authorize',r=>{const s=state();s.changes.change=[];return r.fulfill({json:{...s,revision:'saved123456'}});});await ready(page,'changes-confirm.html');await page.getByRole('button',{name:'Authorize',exact:true}).click();await page.getByRole('button',{name:'Save'}).click();await expect(page.locator('#review-count')).toContainText('0 pending');await expect(page.locator('#warning')).toContainText('Review decisions saved');});

test('fixed service, filtered selections and one toolbar batch request',async({page})=>{
 const s=state();const first=s.changes.change[0];const allElements=first.elements;first.title='First proposal';first.elements=first.elements.slice(0,1);
 const second={...structuredClone(first),id:'change.second',title:'Second proposal',elements:[allElements[1]]};
 const third={...structuredClone(first),id:'change.third',title:'Third proposal',elements:[allElements[2]]};s.changes.change=[first,second,third];
 await connect(page);await page.route('**/api/state',r=>r.fulfill({json:s}));
 let calls=0,payload;await page.route('**/api/authorize',r=>{calls++;payload=r.request().postDataJSON();expect(r.request().url()).toBe('https://aion-review-zu1t.onrender.com/api/authorize');return r.fulfill({json:{...s,revision:'batchsaved',changes:{change:[third]}}});});
 await ready(page,'changes-confirm.html');
 await expect(page.getByRole('textbox',{name:'Backend URL'})).toHaveCount(0);
 await expect(page.locator('.fixed-service-url')).toHaveText('https://aion-review-zu1t.onrender.com');
 const save=page.getByRole('button',{name:'Save',exact:true});await expect(save).toHaveCount(1);await expect(save).toBeDisabled();
 const search=page.locator('#search');expect((await save.boundingBox()).x).toBeGreaterThan((await search.boundingBox()).x);
 await page.getByRole('button',{name:'Authorize',exact:true}).click();await search.fill('Second proposal');
 await page.getByRole('button',{name:'Authorize',exact:true}).click();await expect(page.locator('#selected-count')).toHaveText('2 selected');
 await save.click();expect(calls).toBe(1);expect(payload.action).toBe('save_review');expect(payload.approvals.map(x=>x.change_id)).toEqual(['change.test_review','change.second']);
 await search.fill('');await expect(page.locator('.proposal-card')).toHaveCount(1);await expect(page.locator('#selected-count')).toHaveText('0 selected');
});
test('failed save preserves checkboxes and permits retry',async({page})=>{
 await connect(page);await page.route('**/api/authorize',r=>r.fulfill({status:409,json:{error:'A selected proposal has changed. Reload.'}}));
 await ready(page,'changes-confirm.html');const check=page.getByRole('button',{name:'Authorize',exact:true});await check.click();
 await page.getByRole('button',{name:'Save'}).click();await expect(page.locator('#warning')).toContainText('has changed');
 await expect(check).toHaveAttribute('aria-pressed','true');await expect(page.getByRole('button',{name:'Save'})).toBeEnabled();
});
test('connection form uses fixed service and does not reuse a key from another backend',async({page})=>{
 await page.addInitScript(()=>sessionStorage.setItem('aion-backend',JSON.stringify({url:'https://other.example',token:'other-key'})));
 let calls=0;await page.route('https://aion-review-zu1t.onrender.com/api/state',r=>{calls++;expect(r.request().headers().authorization).toBe('Bearer test-key');return r.fulfill({json:state()});});
 await ready(page,'changes-confirm.html');await expect(page.getByRole('textbox',{name:'Backend access key'})).toHaveValue('');
 await page.getByRole('textbox',{name:'Backend access key'}).fill('test-key');await page.getByRole('button',{name:'Connect',exact:true}).click();
 await expect(page.locator('body')).toHaveAttribute('data-ready','true');await expect.poll(()=>calls).toBeGreaterThanOrEqual(1);
});

test('saving-service visibility persists across application pages and releases layout space',async({page})=>{
 for(const path of ['changes-confirm.html','browser.html','timeline.html']){
  await ready(page,path);const toggle=page.getByRole('button',{name:'Saving service',exact:true}),form=page.locator('#backend-connection');
  if(path==='changes-confirm.html')await expect(form).toBeVisible();else await expect(form).toBeHidden();
  if(await form.isHidden())await toggle.click();const workspace=page.locator('#workspace'),before=await workspace.boundingBox();await toggle.click();await expect(form).toBeHidden();await expect(toggle).toHaveAttribute('aria-expanded','false');const after=await workspace.boundingBox();expect(after.y).toBeLessThan(before.y);expect(after.height).toBeGreaterThan(before.height);
 }
 await page.reload();await expect(page.locator('#backend-connection')).toBeHidden();
});
test('fixed comparison toolbar switches records with arrows and remains visible while content scrolls',async({page})=>{
 await ready(page,'changes-confirm.html');await expect(page.locator('.page-intro')).toHaveCount(0);
 await page.getByLabel('Comparison',{exact:true}).selectOption('details');const picker=page.getByLabel('Affected record',{exact:true}),prev=page.getByRole('button',{name:'Previous affected record'}),next=page.getByRole('button',{name:'Next affected record'});
 await expect(picker).toHaveValue('0');await expect(picker.locator('option').first()).toContainText('John Walker');await expect(prev).toBeDisabled();await next.click();await expect(picker).toHaveValue('1');await next.click();await expect(next).toBeDisabled();await prev.click();await expect(picker).toHaveValue('1');await picker.selectOption('0');await expect(prev).toBeDisabled();
 await page.getByLabel('Comparison',{exact:true}).selectOption('json');await expect(picker).toHaveCount(0);await page.getByLabel('Show full records').check();
 for(const size of [{width:1280,height:720},{width:390,height:844}]){await page.setViewportSize(size);const toolbar=page.locator('.comparison-controls');await toolbar.scrollIntoViewIfNeeded();const before=await toolbar.boundingBox();await page.locator('#proposals').evaluate(e=>e.scrollTop=e.scrollHeight);expect(await page.locator('#proposals').evaluate(e=>e.scrollTop)).toBeGreaterThan(0);expect((await toolbar.boundingBox()).y).toBe(before.y);await expect(page.getByRole('button',{name:'Remove',exact:true})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});

test('keyboard review follows filtered proposals and stages decisions until Save',async({page})=>{
 const s=state(),first=s.changes.change[0];first.title='Keyboard first';
 const middle={...structuredClone(first),id:'change.middle',title:'Excluded middle'};
 const last={...structuredClone(first),id:'change.last',title:'Keyboard last'};s.changes.change=[first,middle,last];
 await connect(page);await page.route('**/api/state',r=>r.fulfill({json:s}));
 let writes=0;await page.route('**/api/authorize',r=>{writes++;return r.abort();});await ready(page,'changes-confirm.html');
 await page.locator('#search').fill('Keyboard');await page.locator('.proposal-nav-item[aria-current="true"]').click();
 const selected=page.locator('.proposal-nav-item[aria-current="true"]');await expect(selected).toContainText('Keyboard first');
 await page.keyboard.press('ArrowUp');await expect(selected).toContainText('Keyboard first');
 await page.keyboard.press('ArrowDown');await expect(selected).toContainText('Keyboard last');await expect(selected).toBeFocused();
 await page.keyboard.press('ArrowDown');await expect(selected).toContainText('Keyboard last');
 await page.keyboard.press('Alt+a');await expect(page.locator('#selected-count')).toHaveText('1 selected');
 await page.keyboard.press('ArrowUp');await expect(selected).toContainText('Keyboard first');
 await page.keyboard.press('Alt+a');await expect(page.locator('#selected-count')).toHaveText('2 selected');
 await page.keyboard.press('Alt+c');const feedback=page.getByRole('textbox',{name:'Refinement feedback'});await expect(feedback).toBeFocused();await expect(page.locator('#selected-count')).toHaveText('1 selected');
 await feedback.fill('Please refine this description.');await page.keyboard.press('ArrowDown');await page.keyboard.press('Alt+a');await expect(page.locator('.proposal-card h2')).toHaveText('Keyboard first');await expect(page.locator('#selected-count')).toHaveText('1 selected');
 await page.getByRole('button',{name:'Cancel feedback'}).click();await page.locator('#search').fill('No such proposal');await page.locator('#search').blur();
 await page.keyboard.press('ArrowDown');await page.keyboard.press('Alt+a');await expect(page.locator('.proposal-card')).toHaveCount(0);await expect(page.locator('#selected-count')).toHaveText('1 selected');expect(writes).toBe(0);
});

test('left and right browse affected records only in Details without stealing native keys',async({page})=>{
 await ready(page,'changes-confirm.html');await page.locator('.proposal-nav-item').click();await page.keyboard.press('ArrowRight');await expect(page.locator('#affected-record-control')).toBeHidden();
 await page.getByLabel('Comparison',{exact:true}).selectOption('details');await page.locator('#proposal-details').focus();
 const picker=page.getByLabel('Affected record',{exact:true});await page.keyboard.press('ArrowLeft');await expect(picker).toHaveValue('0');
 await page.keyboard.press('ArrowRight');await expect(picker).toHaveValue('1');await page.keyboard.press('ArrowRight');await expect(picker).toHaveValue('2');await page.keyboard.press('ArrowRight');await expect(picker).toHaveValue('2');await page.keyboard.press('ArrowLeft');await expect(picker).toHaveValue('1');
 await picker.focus();await page.keyboard.press('ArrowUp');await expect(picker).toHaveValue('0');await page.keyboard.press('Alt+a');await expect(page.locator('#selected-count')).toHaveText('0 selected');
 const splitter=page.getByRole('separator',{name:'Resize proposal navigator'});await splitter.focus();await page.keyboard.press('ArrowRight');await expect(picker).toHaveValue('0');
 await page.locator('#search').focus();await page.keyboard.press('Alt+c');await expect(page.getByRole('textbox',{name:'Refinement feedback'})).toHaveCount(0);
});

test('keyboard authorization respects disabled review decisions and saving lock',async({page})=>{
 const s=state();await connect(page);await page.route('**/api/state',r=>r.fulfill({json:s}));await ready(page,'changes-confirm.html');
 await page.getByRole('button',{name:'Remove',exact:true}).click();await page.keyboard.press('Alt+a');await page.keyboard.press('Alt+c');await expect(page.locator('#selected-count')).toHaveText('0 selected');await expect(page.getByRole('textbox',{name:'Refinement feedback'})).toHaveCount(0);
 await page.getByRole('button',{name:'Undo removal'}).click();await page.keyboard.press('Alt+a');await expect(page.locator('#selected-count')).toHaveText('1 selected');
 let release;const saving=new Promise(resolve=>release=resolve);await page.route('**/api/authorize',async r=>{await saving;await r.fulfill({json:{...s,revision:'saved-keyboard',changes:{change:[]}}});});
 await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page.locator('#warning')).toContainText('Saving review decisions');
 await page.keyboard.press('Alt+a');await page.keyboard.press('Alt+c');await page.keyboard.press('ArrowDown');await expect(page.locator('#selected-count')).toHaveText('1 selected');await expect(page.getByRole('textbox',{name:'Refinement feedback'})).toHaveCount(0);release();await expect(page.locator('#review-count')).toContainText('0 pending');
});

test('connection distinguishes rejected keys from upstream and deployment failures',async({page})=>{
 await ready(page,'changes-confirm.html');
 const connection=page.locator('#backend-connection'),status=connection.getByRole('status'),connect=connection.getByRole('button',{name:'Connect',exact:true});
 await page.getByRole('textbox',{name:'Backend access key'}).fill('local-diagnostic-key');
 let response;await page.route('**/api/state',r=>response==='network'?r.abort():r.fulfill(response));
 for(const [reply,message] of [
  [{status:401,json:{error:'Connect with the backend access key'}},'The backend access key was rejected (HTTP 401)'],
  [{status:502,json:{error:'GitHub could not read repository data (HTTP 401): Bad credentials'}},'Saving service error (HTTP 502): GitHub could not read repository data (HTTP 401): Bad credentials'],
  [{status:502,json:{error:'The backend must be updated for this repository schema version.'}},'Saving service error (HTTP 502): The backend must be updated for this repository schema version.'],
  [{status:403,json:{error:'Origin not allowed'}},'Saving service error (HTTP 403): Origin not allowed'],
  [{status:503,contentType:'text/html',body:'<h1>Service unavailable</h1>'},'Saving service returned HTTP 503. The service or its upstream dependency is unavailable'],
  [{status:200,contentType:'text/html',body:'<h1>Incorrect service</h1>'},'The saving service returned an invalid state response (HTTP 200)'],
  [{status:200,json:{message:'Wrong API'}},'The saving service returned an invalid state response (HTTP 200)'],
  ['network','Cannot reach the saving service.']
 ]){
  response=reply;await connect.click();await expect(status).toContainText(message);await expect(connect).toBeEnabled();await expect(status.locator('h1')).toHaveCount(0);
  expect(await page.evaluate(()=>sessionStorage.getItem('aion-backend'))).toBeNull();
 }
});

test('configured sessions show the actual backend failure and retain disconnect recovery',async({page})=>{
 await connect(page);await page.route('**/api/state',r=>r.fulfill({status:502,json:{error:'GitHub could not read repository data (HTTP 403): rate limit exceeded'}}));
 await page.goto('/code/changes-confirm.html');await expect(page.locator('.error')).toContainText('Saving service error (HTTP 502): GitHub could not read repository data (HTTP 403): rate limit exceeded');
 await expect(page.locator('.error')).toContainText('Reconnect or disconnect to browse published data.');await expect(page.getByRole('button',{name:'Disconnect',exact:true})).toBeEnabled();
});
