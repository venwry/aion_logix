const {test,expect}=require('@playwright/test');
for(const pageName of ['browser','timeline'])test(pageName+' selects composition versions without nesting the history table',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/data_foundation/device.json',async route=>{
  const response=await route.fetch(),doc=await response.json();
  const record=doc.device.find(r=>r.id==='device.ram_64kb_x32');
  // This fixture deliberately exercises historical per-version detail rendering.
  delete record.technical_specification;
  record.composition_history=[
   {version_number:1,description:'Initial module',effective_from:{kind:'unknown'},effective_until:{kind:'unknown'},technical_definition:{specification:{capacity_kb:64}},composition_definition:[{id:'first',target:{record_id:'base_part.dram_16kbit'},quantity:32,unit:'each'}],assembly_requirements:[{number:1,kind:'testing',description:'Test initial module'}]},
   {version_number:2,description:'Expanded module',effective_from:{kind:'event',event_id:'event.autodesk_agreement'},effective_until:{kind:'open'},technical_definition:{specification:{capacity_kb:128}},composition_definition:[{id:'second',target:{record_id:'base_part.dram_16kbit'},quantity:64,unit:'each'}],assembly_requirements:[{number:1,kind:'testing',description:'Test expanded module'}]},
   {version_number:3,description:'Unspecified construction',effective_from:{kind:'process_boundary',process_id:'process.aurelia_campaign_preparation',boundary:'end'},effective_until:{kind:'unknown'},technical_definition:{},composition_definition:[],assembly_requirements:[]}
  ];await route.fulfill({json:doc});
 });
 await page.goto('/code/'+pageName+'.html#device.ram_64kb_x32');await expect(page.locator('body')).toHaveAttribute('data-ready','true');
 const history=page.locator('.composition-history'),picker=page.getByLabel('Composition history');
 await expect(picker.locator('option')).toHaveCount(3);
 await expect(picker.locator('option').first()).toHaveText('1 - Initial module (unknown - unknown)');
 await expect(picker.locator('option').nth(1)).toContainText('2 - Expanded module (1982-01-31 · Adam funds Autodesk founders and the entire Artemis development environment');await expect(picker.locator('option').nth(1)).toContainText(' - open)');
 await expect(picker.locator('option').nth(2)).toContainText('1978-06-08 · Aurelia campaign preparation and NCC launch — end');
 const technical=history.locator('[data-field="technical_definition"]'),composition=history.locator('[data-field="composition_definition"]'),assembly=history.locator('[data-field="assembly_requirements"]');
 await expect(technical).toContainText('64');await expect(composition.locator('tbody tr')).toHaveCount(1);await expect(assembly).toContainText('Test initial module');
 await expect(history.locator('table table')).toHaveCount(0);
 await picker.selectOption('1');await expect(technical).toContainText('128');await expect(composition.locator('tbody')).toContainText('second');await expect(assembly).toContainText('Test expanded module');await expect(history).not.toContainText('Test initial module');
 const table=composition.locator('table');await expect(table).toHaveAttribute('data-sizing','auto');await table.getByRole('separator').first().press('ArrowRight');await expect(table).toHaveAttribute('data-sizing','manual');
 await picker.selectOption('2');await expect(history.locator('table')).toHaveCount(0);await expect(assembly).toContainText('No assembly requirements specified.');
 await picker.selectOption('0');await expect(composition.locator('table')).toHaveAttribute('data-sizing','auto');
 await page.setViewportSize({width:390,height:844});expect(await picker.evaluate(n=>n.getBoundingClientRect().width<=n.parentElement.getBoundingClientRect().width)).toBe(true);
 await composition.locator('a.ref-link').click();await expect(page.locator('#details .record-id')).toHaveText('base_part.dram_16kbit');await expect(picker).toHaveCount(0);expect(errors).toEqual([]);
});
