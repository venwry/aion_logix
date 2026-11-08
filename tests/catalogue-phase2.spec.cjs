const {test,expect}=require('@playwright/test');
const external={id:'external_product.test_cpm',name:'DRI licensed CP/M test',description:'Licensed software, distinct from the Logix cartridge.',specification:[{no:1,description:'DRI owns the software.',ref_id:'actor.dri',ref_role:'software owner and licensor'}]};
async function inject(page){
 await page.route('**/data_foundation/external_products.json',r=>r.fulfill({json:{external_product:[external]}}));
 await page.route('**/data_foundation/event.json',async r=>{const d=await (await r.fetch()).json();d.event.find(e=>e.id==='event.aurelia_launch').subject_ids.push(external.id);await r.fulfill({json:d});});
}
async function ready(page,url){await page.goto('/code/'+url);await expect(page.locator('body')).toHaveAttribute('data-ready','true');}
test('external products browse, filter, show role-labelled specifications and link to the plural dataset',async({page})=>{
 await inject(page);await ready(page,'browser.html#'+external.id);
 await expect(page.locator('#dataset')).toHaveValue('external_product');await expect(page.locator('#details h2')).toHaveText(external.name);
 await expect(page.locator('#details')).toContainText('Pending authorization');await expect(page.locator('#details')).toContainText('software owner and licensor');
 await expect(page.locator('#details .compact-value-table thead')).toContainText('ref_role');
 await expect(page.getByRole('link',{name:'Open dataset ↗'})).toHaveAttribute('href','../data_foundation/external_products.json');
 await page.locator('#details').getByRole('link',{name:'Digital Research',exact:true}).click();await expect(page.locator('#dataset')).toHaveValue('actor');
 await page.locator('#dataset').selectOption('external_product');await expect(page.locator('#rows tr')).toHaveCount(1);
});
test('timeline details can follow external subjects and return with Go Back',async({page})=>{
 await inject(page);await ready(page,'timeline.html#event.aurelia_launch');await page.locator('#details').getByRole('link',{name:external.name,exact:true}).click();
 await expect(page.locator('#details h2')).toHaveText(external.name);await expect(page.locator('#details')).toContainText('software owner and licensor');
 await page.getByRole('button',{name:'Go Back',exact:true}).click();await expect(page.locator('#details .record-id')).toHaveText('event.aurelia_launch');
});
test('Changes confirm compares external product additions in JSON and detail modes without authorizing live data',async({page})=>{
 const proposal={id:'change.external_test',category:'story',title:'Introduce licensed software identity',reason:'Test external record review.',elements:[{record_type:'external_product',record_id:external.id,before:null,after:external}]};
 await page.route('**/data_storytelling/change.json',r=>r.fulfill({json:{change:[proposal]}}));
 await ready(page,'changes-confirm.html');await expect(page.locator('.change-table')).toContainText('external_product.test_cpm');
 await page.getByLabel('Comparison',{exact:true}).selectOption('details');await expect(page.locator('.comparison-column').nth(1)).toContainText('software owner and licensor');
 await expect(page.locator('.comparison-column').nth(1)).toContainText('Digital Research');
});
test('product launch campaign and event links render independently',async({page})=>{
 await page.route('**/data_foundation/product.json',async r=>{const d=await (await r.fetch()).json();Object.assign(d.product.find(p=>p.id==='product.aurelia_mono'),{launch_campaign_id:'campaign.ncc1978',launch_event_id:'event.aurelia_launch'});await r.fulfill({json:d});});
 await ready(page,'browser.html#product.aurelia_mono');
 await expect(page.locator('#details')).toContainText('launch_campaign_id');await expect(page.locator('#details')).toContainText('launch_event_id');
 await page.locator('#details a[href="#event.aurelia_launch"]').first().click();await expect(page.locator('#details .record-id')).toHaveText('event.aurelia_launch');
});
