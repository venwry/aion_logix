const {test,expect}=require('@playwright/test');
for(const pageName of ['browser','timeline']){
 test(pageName+' detail columns resize, respect headers, and reset to autofit',async({page})=>{
  await page.route('**/data_foundation/event.json',async route=>{const response=await route.fetch(),doc=await response.json(),record=doc.event.find(r=>r.id==='event.autodesk_agreement');record.subject_ids=['actor.adam'];record.inputs=[{number:1,type:'resource',description:'Reference list display fixture',subject_ids:['actor.adam','actor.dri']}];await route.fulfill({json:doc});});
  await page.goto('/code/'+pageName+'.html#event.autodesk_agreement');await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  await expect(page.locator('#details .compact-field > .reference-list > .reference-header').filter({hasText:'subject_ids:'})).toHaveCount(1);
  const cellList=page.locator('#details td .reference-list');await expect(cellList).toHaveCount(1);await expect(cellList.locator('.reference-header')).toHaveCount(0);await expect(cellList.locator('.reference-entry')).toHaveCount(2);await expect(page.locator('#details th .column-title').filter({hasText:/^subject_ids$/})).toHaveCount(1);
  const table=page.locator('#details .compact-value-table').first(),header=table.locator('th').first(),handle=header.getByRole('separator');
  const original=(await header.boundingBox()).width;await handle.focus();await handle.press('ArrowRight');expect((await header.boundingBox()).width).toBeGreaterThan(original+10);
  await handle.press('Home');const title=await header.locator('.column-title').boundingBox();expect((await header.boundingBox()).width).toBeGreaterThan(title.width);
  const grip=await handle.boundingBox();await page.mouse.move(grip.x+grip.width/2,grip.y+grip.height/2);await page.mouse.down();await page.mouse.move(grip.x+grip.width/2+60,grip.y+grip.height/2);await page.mouse.up();expect((await header.boundingBox()).width).toBeGreaterThan(title.width+60);
  await table.getByRole('button',{name:'Autofit all columns'}).click();await expect(table).toHaveAttribute('data-sizing','auto');expect(Math.abs((await header.boundingBox()).width-original)).toBeLessThan(3);
 });
 test(pageName+' reference grids use plain IDs, linked names and a fixed single column',async({page})=>{
  await page.goto('/code/'+pageName+'.html#campaign.ncc1978');await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  const list=page.locator('#details .reference-list').filter({has:page.locator('.reference-grid .reference-entry:nth-child(3)')}).first();
  await expect(page.locator('#details .reference-controls')).toHaveCount(0);
  await expect(list.getByRole('spinbutton')).toHaveCount(0);
  await expect(list.getByRole('button')).toHaveCount(0);
  for(const width of [1440,390]){
   await page.setViewportSize({width,height:1000});
   expect(await list.locator('.reference-grid').evaluate(n=>getComputedStyle(n).gridTemplateColumns.split(' ').length)).toBe(1);
  }
  const entry=list.locator('.reference-entry').first();expect(await entry.locator('.reference-id').evaluate(n=>n.tagName)).toBe('SPAN');expect(await entry.locator('.reference-name').evaluate(n=>getComputedStyle(n).textOverflow)).toBe('ellipsis');
  const id=await entry.locator('.reference-id').textContent();expect(await entry.locator('a').textContent()).not.toContain(id);
  await entry.locator('a').click();await expect(page.locator('#details .record-id')).toHaveText(id);
 });
}
for(const pageName of ['browser','timeline'])test(pageName+' autofit prioritizes long descriptions over numeric columns',async({page})=>{
 await page.route('**/data_foundation/event.json',async route=>{const response=await route.fetch(),doc=await response.json();doc.event.find(r=>r.id==='event.autodesk_agreement').inputs=[1,2,3].map(number=>({number,type:'requirement',description:'A detailed requirement describing the supplied development systems and engineering support. '.repeat(number+2)}));await route.fulfill({json:doc});});
 await page.goto('/code/'+pageName+'.html#event.autodesk_agreement');await expect(page.locator('body')).toHaveAttribute('data-ready','true');
 const table=page.locator('.compact-value-table').filter({has:page.locator('.column-title',{hasText:/^description$/})}).first();await expect(table).toHaveAttribute('data-sizing','auto');
 const numeric=table.locator('th').filter({has:page.locator('.column-title',{hasText:/^number$/})}),description=table.locator('th').filter({has:page.locator('.column-title',{hasText:/^description$/})});
 expect((await description.boundingBox()).width).toBeGreaterThan((await numeric.boundingBox()).width*2);
 for(const header of await table.locator('th').all())expect((await header.boundingBox()).width).toBeGreaterThan((await header.locator('.column-title').boundingBox()).width);
 if(pageName==='timeline'){await expect(page.locator('#details').getByRole('link',{name:'Open in timeline →'})).toHaveCount(0);await page.getByRole('link',{name:'Open in Data browser →'}).click();await expect(page).toHaveURL(/browser.html#event.autodesk_agreement$/);await expect(page.locator('#details .record-id')).toHaveText('event.autodesk_agreement');}
});
