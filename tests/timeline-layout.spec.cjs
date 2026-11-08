const {test,expect}=require('@playwright/test');
async function ready(page){await page.goto('/code/timeline.html');await expect(page.locator('body')).toHaveAttribute('data-ready','true');}
const card=(page,id)=>page.locator('#timeline .timeline-card[data-record-id="'+id+'"]');
test('Harvard shares a compact track panel and keeps graduation at the global end date',async({page})=>{
 await ready(page);await page.locator('#search').fill('process.harvard_education');
 const group=page.locator('[data-group-id="process.harvard_education"]');await expect(group.locator('.duration-track')).toHaveCount(5);
 const parent=card(page,'process.harvard_education'),year=card(page,'process.harvard_year_1');expect((await parent.boundingBox()).height).toBe(54);expect((await parent.boundingBox()).x).toBe((await year.boundingBox()).x);
 const rails=await group.locator('.duration-track').evaluateAll(ns=>ns.map(n=>({id:n.dataset.recordId,x:n.style.left,top:n.style.top,height:n.style.height})));
 expect(new Set(rails.slice(1).map(n=>n.x)).size).toBe(1);expect(rails[0].x).not.toBe(rails[1].x);
 const graduation=card(page,'event.harvard_graduation');await expect(graduation).toHaveCount(1);await expect(graduation).toHaveAttribute('data-boundary','end');
 const tick=page.locator('.date-tick[data-date="1976-06-17"]');expect(Number(await graduation.getAttribute('data-anchor'))).toBe(await tick.evaluate(n=>parseFloat(n.style.top)));
 await graduation.locator('.timeline-heading').click();await expect(page.locator('#details .record-id')).toHaveText('event.harvard_graduation');
});
test('investment uses a start event, milestone and literal end marker without inventing an end card',async({page})=>{
 await ready(page);await page.locator('#search').fill('process.stock_market_investment');const group=page.locator('[data-group-id="process.stock_market_investment"]');
 await expect(group.locator('.timeline-card')).toHaveCount(3);await expect(group.locator('[data-boundary="start"]')).toHaveAttribute('data-record-id','event.us_nyse_start');await expect(group.locator('[data-boundary="end"]')).toHaveCount(0);
 await expect(group.locator('.track-marker.end')).toHaveAttribute('title','End: 1977-12-31');await expect(group.locator('.track-marker.milestone')).toHaveAttribute('data-record-id','event.office');
 await expect(card(page,'event.office')).toHaveCSS('background-color','rgb(240, 240, 240)');
});
test('overlapping children use distinct tracks but a common card edge',async({page})=>{
 await ready(page);const group=page.locator('[data-group-id="process.aion_manufacturing_maturation"]');const a=group.locator('[data-track-id="process.process_275"]'),b=group.locator('[data-track-id="process.dram_repair"]');
 expect(await a.evaluate(n=>n.style.left)).not.toBe(await b.evaluate(n=>n.style.left));expect((await card(page,'process.process_275').boundingBox()).x).toBe((await card(page,'process.dram_repair').boundingBox()).x);
 const ra=await a.boundingBox(),rb=await b.boundingBox();expect(ra.y).toBeLessThan(rb.y+rb.height);expect(ra.y+ra.height).toBeGreaterThan(rb.y);
});
test('campaign badge and agreement badge open the right records',async({page})=>{
 await ready(page);const campaign=card(page,'campaign.ncc1978');await expect(campaign).toHaveCount(1);await expect(card(page,'process.ncc1978_campaign')).toHaveCount(0);
 await campaign.locator('.timeline-campaign').click();await expect(page.locator('#details .record-id')).toHaveText('campaign.ncc1978');
 await campaign.locator('.timeline-kind').click();await expect(page.locator('#details .record-id')).toHaveText('process.ncc1978_campaign');
 const agreement=card(page,'event.dri_founding').locator('.timeline-agreement');expect(await agreement.evaluate(n=>n.previousElementSibling.classList.contains('timeline-state'))).toBe(true);await agreement.click();await expect(page.locator('#details .record-id')).toHaveText('agreement.dri_founding');
 expect(await campaign.locator('.timeline-campaign').evaluate(n=>getComputedStyle(n).backgroundColor)).toBe('rgb(246, 221, 221)');
});
test('all cards in a group are disjoint, and equal-date anchors match the global axis',async({page})=>{
 await ready(page);
 const errors=await page.locator('.timeline-group').evaluateAll(groups=>groups.flatMap(g=>{const cards=[...g.querySelectorAll('.timeline-card')];return cards.flatMap((a,i)=>cards.slice(i+1).filter(b=>{const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();return x.left<y.right&&x.right>y.left&&x.top<y.bottom&&x.bottom>y.top;}).map(b=>a.dataset.recordId+' / '+b.dataset.recordId));}));expect(errors).toEqual([]);
 for(const id of ['event.basic_launch','event.tandy_ncc_demo','event.ncc79_campaign'])expect(Number(await card(page,id).getAttribute('data-anchor'))).toBe(await page.locator('.date-tick[data-date="1979-06-04"]').evaluate(n=>parseFloat(n.style.top)));
});
test('undated work stays separate and clipped tracks show continuation arrows',async({page})=>{
 await page.route('**/data_foundation/process.json',async route=>{const doc=await (await route.fetch()).json();doc.process.push({id:'process.test_unknown',title:'Undated test work',kind:'development',period:{start:{precision:'unknown'},end:{precision:'unknown'}},steps:[]});await route.fulfill({json:doc});});
 await ready(page);await expect(page.locator('#undated [data-record-id="process.test_unknown"]')).toHaveCount(1);await expect(card(page,'process.test_unknown')).toHaveCount(0);expect(await page.locator('#undated [data-record-id="process.test_unknown"]').evaluate(n=>getComputedStyle(n).backgroundColor)).toBe('rgb(225, 235, 244)');
 await page.locator('#from').selectOption('1974');await page.locator('#to').selectOption('1975');const group=page.locator('[data-group-id="process.stock_market_investment"]');await expect(group.locator('.continued-start')).toHaveCount(1);await expect(group.locator('.continued-end')).toHaveCount(1);await expect(group.locator('.track-marker.start,.track-marker.end')).toHaveCount(0);
});
test('filter context, URL selection, keyboard badges and fullscreen work on narrow screens',async({page})=>{
 await ready(page);await page.locator('#search').fill('event.harvard_graduation');await expect(card(page,'process.harvard_education')).toHaveAttribute('data-context','true');
 await card(page,'event.harvard_graduation').locator('.timeline-heading').focus();await page.keyboard.press('Enter');await expect(page).toHaveURL(/#event.harvard_graduation$/);
 await page.locator('#timeline-fullscreen').click();await expect(page.locator('#filters')).toBeHidden();await page.keyboard.press('Escape');await expect(page.locator('#filters')).toBeVisible();
 await page.setViewportSize({width:390,height:844});await page.locator('#timeline-fullscreen').click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('date rail stays pinned while cards scroll horizontally',async({page})=>{
 await ready(page);
 for(const year of ['1973','1978','1980']){const label=page.locator('.axis-year').filter({hasText:new RegExp('^'+year+'$')}),line=page.locator('[data-year="'+year+'"] .year-line');const a=await label.boundingBox(),b=await line.boundingBox();expect(Math.abs(a.y+a.height/2-b.y)).toBeLessThan(1);}
 const rail=page.locator('.date-axis'),first=page.locator('.timeline-group').first(),before={rail:await rail.boundingBox(),card:await first.boundingBox()};await page.locator('#timeline-pane').evaluate(n=>n.scrollLeft=200);
 expect((await rail.boundingBox()).x).toBe(before.rail.x);expect((await first.boundingBox()).x).toBeLessThan(before.card.x-100);
});
