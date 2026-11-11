const {test,expect}=require('@playwright/test');const fs=require('node:fs');
const products=JSON.parse(fs.readFileSync('data_foundation/product.json')).product;
const launchedAt=id=>products.filter(p=>p.launch_event_id===id);
async function ready(page,id){await page.goto('/code/timeline.html#'+id);await expect(page.locator('body')).toHaveAttribute('data-ready','true');}
test('timeline lists exactly the event’s launched products immediately after its description',async({page})=>{
 await ready(page,'event.aurelia_launch');
 const list=page.locator('#details [data-field="description"] + [data-field="launched_products"]');await expect(list).toBeVisible();await expect(list.locator('.compact-key')).toHaveText('Launched products: ');
 expect(await list.locator('.reference-id').allTextContents()).toEqual(launchedAt('event.aurelia_launch').map(p=>p.id));
 const card=page.locator('.timeline-card[data-record-id="event.aurelia_launch"]');await expect(card).toHaveAttribute('data-product-launch','true');await expect(card).toHaveCSS('background-color','rgb(223, 240, 223)');
 await card.scrollIntoViewIfNeeded();await card.hover();await expect(card).toHaveCSS('background-color','rgb(223, 240, 223)');
 const link=list.locator('a').first(),href=await link.getAttribute('href');await link.click();await expect(page.locator('#details .record-id')).toHaveText(decodeURIComponent(href.slice(1)));
});
test('an unreferenced event is not green and has no launched-products section, even with launch kind',async({page})=>{
 await ready(page,'event.aurelia_sales_premiere');await expect(page.locator('#details .launched-products')).toHaveCount(0);
 const card=page.locator('.timeline-card[data-record-id="event.aurelia_sales_premiere"]');await expect(card).toHaveAttribute('data-product-launch','false');await expect(card).not.toHaveCSS('background-color','rgb(223, 240, 223)');
});
test('product references, not event kind, determine launch display across every boundary occurrence',async({page})=>{
 await page.route('**/data_foundation/event.json',async route=>{const doc=await(await route.fetch()).json();doc.event.find(r=>r.id==='event.artemis_launch').kind='activity';await route.fulfill({json:doc});});
 await ready(page,'event.artemis_launch');const list=page.locator('#details .launched-products');expect(await list.locator('.reference-id').allTextContents()).toEqual(launchedAt('event.artemis_launch').map(p=>p.id));
 const cards=page.locator('.timeline-card[data-record-id="event.artemis_launch"]');expect(await cards.count()).toBeGreaterThan(0);for(const card of await cards.all()){await expect(card).toHaveAttribute('data-product-launch','true');await expect(card).toHaveCSS('background-color','rgb(223, 240, 223)');}
});
