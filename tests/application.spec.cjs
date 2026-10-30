const {test,expect}=require('@playwright/test');
async function ready(page,path){await page.goto('/code/'+path);await expect(page.locator('body')).toHaveAttribute('data-ready','true');}
test('timeline preserves deep links, spans, variable years and filters',async({page})=>{
 await ready(page,'timeline.html#process.economics_studies');
 await expect(page.locator('#details h2')).toHaveText('Economics studies');
 const heights=await page.locator('.year-section').evaluateAll(nodes=>nodes.map(n=>Math.round(n.getBoundingClientRect().height)));
 expect(new Set(heights).size).toBeGreaterThan(1);
 const span=page.locator('[data-span-id="process.economics_studies"]');await expect(span).toHaveCount(1);
 expect(await span.evaluate(n=>Number(n.getAttribute('y2'))-Number(n.getAttribute('y1')))).toBeGreaterThan(400);
 await page.locator('#type').selectOption('campaign');
 await expect(page.locator('#timeline .timeline-card').first()).toContainText('execution process range');
 await page.locator('#status').selectOption('authorized');await expect(page.locator('#timeline')).toContainText('No dated records match');
 await page.getByRole('button',{name:'Reset filters'}).click();
 await page.locator('#search').fill('public command of economics');await expect(page.locator('#timeline .timeline-card')).toHaveCount(1);
});
test('browser supports sorting, pagination, empty datasets and related records',async({page})=>{
 await ready(page,'browser.html#agreement.autodesk_development');
 await expect(page.locator('#details h2')).toContainText('Autodesk');
 await page.locator('#details').getByRole('button',{name:'Adam Pleskot',exact:true}).click();
 await expect(page.locator('#dataset')).toHaveValue('actor');await expect(page.locator('#details h2')).toHaveText('Adam Pleskot');
 await page.locator('[data-sort="title"]').click();await expect(page.locator('th').first()).toHaveAttribute('aria-sort','descending');
 await page.locator('#dataset').selectOption('event');await expect(page.locator('#rows tr')).toHaveCount(75);
 await page.locator('#next').click();await expect(page.locator('#page-number')).toContainText('Page 2');
 await page.locator('#dataset').selectOption('campaign');await page.locator('#status').selectOption('authorized');await expect(page.locator('#no-results')).toBeVisible();await page.locator('#status').selectOption('');
 await page.locator('#dataset').selectOption('event');await page.locator('#search').fill('unfindable-record-xyz');await expect(page.locator('#rows tr')).toHaveCount(0);
});
for(const name of ['timeline','browser'])test(name+' split supports keyboard, drag, persistence and mobile',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await ready(page,name+'.html');
 const bar=page.getByRole('separator');const before=Number(await bar.getAttribute('aria-valuenow'));await bar.focus();await page.keyboard.press('ArrowRight');await expect(bar).toHaveAttribute('aria-valuenow',String(before+24));
 const box=await bar.boundingBox();await page.mouse.move(box.x+5,box.y+50);await page.mouse.down();await page.mouse.move(box.x+65,box.y+50);await page.mouse.up();
 const after=await bar.getAttribute('aria-valuenow');expect(Number(after)).toBeGreaterThan(before+24);await page.reload();await expect(page.locator('body')).toHaveAttribute('data-ready','true');await expect(bar).toHaveAttribute('aria-valuenow',after);
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(bar).toBeHidden();
});
test('application index redirects and navigation switches pages',async({page})=>{
 await ready(page,'index.html');await expect(page).toHaveURL(/timeline.html/);await page.getByRole('navigation').getByRole('link',{name:'Data browser'}).click();await expect(page.locator('body')).toHaveAttribute('data-ready','true');await expect(page).toHaveURL(/browser.html/);
});
test('failed dataset request shows a useful error',async({page})=>{
 await page.route('**/data_foundation/event.json',route=>route.fulfill({status:503,body:'Unavailable'}));await page.goto('/code/timeline.html');await expect(page.getByRole('button',{name:'Try again'})).toBeVisible();
});
