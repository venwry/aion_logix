const {test,expect}=require('@playwright/test');
async function ready(page){await page.goto('/code/timeline.html');await expect(page.locator('body')).toHaveAttribute('data-ready','true');}
test('process containers nest milestones, merge campaign execution and cross year lines',async({page})=>{
 await ready(page);
 const campaign=page.locator('#timeline [data-record-id="campaign.ncc1978"]');
 await expect(campaign).toHaveCount(1);
 await expect(page.locator('#timeline [data-record-id="process.ncc1978_campaign"]')).toHaveCount(0);
 await expect(campaign.locator(':scope > .timeline-meta')).toContainText('Campaign / Process');
 await expect(campaign.locator(':scope > [data-record-id="event.aurelia_launch"]')).toHaveCount(1);
 const parent=page.locator('[data-record-id="process.economics_studies"]'),child=parent.locator('[data-record-id="process.harvard_year_1"]');
 const p=await parent.boundingBox(),c=await child.boundingBox();expect(c.x).toBeGreaterThan(p.x);expect(c.y).toBeGreaterThan(p.y);expect(c.x+c.width).toBeLessThan(p.x+p.width);expect(c.y+c.height).toBeLessThan(p.y+p.height);
 const line=await page.locator('[data-year="1973"] .year-line').boundingBox();expect(p.y).toBeLessThan(line.y);expect(p.y+p.height).toBeGreaterThan(line.y);
 expect(await parent.evaluate(n=>getComputedStyle(n).zIndex)).toBe('1');expect(await page.locator('[data-year="1973"]').evaluate(n=>getComputedStyle(n).zIndex)).toBe('0');
 await campaign.locator(':scope > .timeline-meta').getByRole('button',{name:'Process',exact:true}).click();
 await expect(page.locator('#details .record-id')).toHaveText('process.ncc1978_campaign');
 await expect(page.locator('#details details')).toHaveCount(0);await expect(page.locator('#details')).toContainText('period.start.value:');
 await expect(page.locator('#details .reference-entry').first()).toContainText(' - ');
 await expect(page.locator('#details > :last-child').getByRole('link',{name:'Open dataset ↗'})).toBeVisible();
});
test('overlapping top-level processes occupy different horizontal space',async({page})=>{
 await ready(page);const a=await page.locator('[data-record-id="process.process_275"]').boundingBox(),b=await page.locator('[data-record-id="process.dram_repair"]').boundingBox();
 expect(a.y).toBeLessThan(b.y+b.height);expect(a.y+a.height).toBeGreaterThan(b.y);expect(a.x+a.width<=b.x||b.x+b.width<=a.x).toBe(true);
});
test('full screen hides upper sections and Escape restores filters and selected details',async({page})=>{
 await ready(page);await page.locator('#search').fill('Harvard');const toggle=page.locator('#timeline-fullscreen');await toggle.click();
 for(const selector of ['.app-header','.page-intro','#filters','#backend-connection'])await expect(page.locator(selector)).toBeHidden();
 await expect(toggle).toHaveAttribute('aria-pressed','true');await expect(page.locator('#workspace')).toBeVisible();
 expect((await toggle.boundingBox()).x).toBeLessThan((await page.locator('.legend').boundingBox()).x);
 await page.keyboard.press('Escape');await expect(page.locator('#filters')).toBeVisible();await expect(page.locator('#search')).toHaveValue('Harvard');await expect(toggle).toHaveAttribute('aria-pressed','false');
 await page.setViewportSize({width:390,height:844});await toggle.click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('process dates occupy top and bottom and the date axis is chronological',async({page})=>{
 await ready(page);const box=page.locator('[data-record-id="process.harvard_year_3"]');
 await expect(box.locator(':scope > .timeline-meta')).toContainText('1974-09-23');await expect(box.locator(':scope > .timeline-meta')).not.toContainText('1975-06-12');await expect(box.locator(':scope > .timeline-end-date')).toHaveText('1975-06-12');
 const b=await box.boundingBox(),end=await box.locator(':scope > .timeline-end-date').boundingBox();expect(b.y+b.height-end.y-end.height).toBeLessThan(12);
 const ticks=await page.locator('.date-tick').evaluateAll(ns=>ns.map(n=>({date:n.dataset.date,top:parseFloat(n.style.top)})));expect(ticks.length).toBeGreaterThan(100);for(let i=1;i<ticks.length;i++){expect(ticks[i].date>ticks[i-1].date).toBe(true);expect(ticks[i].top-ticks[i-1].top).toBeGreaterThanOrEqual(24);}
 const icon=page.locator('link[rel="icon"]');expect(await icon.getAttribute('href')).toBe('../assets/aion-favicon.png');const response=await page.request.get('/assets/aion-favicon.png');expect(response.ok()).toBe(true);
});
test('compact date rail pins dates and bold red years while timeline cards scroll',async({page})=>{
 await ready(page);const rail=page.locator('.date-axis'),year=rail.locator('.axis-year').first(),spine=rail.locator('.date-spine'),card=page.locator('#timeline > .timeline-card').first();
 const before={rail:await rail.boundingBox(),year:await year.boundingBox(),card:await card.boundingBox()};expect(before.rail.width).toBe(92);expect(before.year.x).toBeGreaterThan((await spine.boundingBox()).x);
 const style=await year.evaluate(n=>({size:getComputedStyle(n).fontSize,weight:getComputedStyle(n).fontWeight,color:getComputedStyle(n).color}));expect(style).toEqual({size:'9px',weight:'700',color:'rgb(133, 45, 53)'});
 await page.locator('#timeline-pane').evaluate(n=>n.scrollLeft=200);
 expect((await rail.boundingBox()).x).toBe(before.rail.x);expect((await year.boundingBox()).x).toBe(before.year.x);expect((await card.boundingBox()).x).toBeLessThan(before.card.x-100);
});

test('boundary events are grey, bracket steps, and shared occurrences select the same record',async({page})=>{
 await ready(page);
 const birmingham=page.locator('[data-record-id="process.birmingham_estate"]'),frankfurt=page.locator('[data-record-id="process.frankfurt_stay"]');
 const identity=birmingham.locator(':scope > [data-boundary="start"]'),departure=birmingham.locator(':scope > [data-boundary="end"]'),arrival=frankfurt.locator(':scope > [data-boundary="start"]'),flight=frankfurt.locator(':scope > [data-boundary="end"]');
 await expect(identity).toHaveAttribute('data-record-id','event.identity');await expect(departure).toHaveAttribute('data-record-id','event.frankfurt_move');await expect(arrival).toHaveAttribute('data-record-id','event.frankfurt_move');await expect(flight).toHaveAttribute('data-record-id','event.new_york_flight');
 expect(await identity.evaluate(n=>getComputedStyle(n).backgroundColor)).toBe('rgb(240, 240, 240)');
 const start=await arrival.boundingBox(),end=await flight.boundingBox();
 for(const step of await frankfurt.locator(':scope > .timeline-card:not([data-boundary])').all()){const box=await step.boundingBox();expect(box.y).toBeGreaterThan(start.y+start.height);expect(box.y+box.height).toBeLessThan(end.y);}
 await arrival.locator(':scope > .timeline-heading').click();await expect(page.locator('#details .record-id')).toHaveText('event.frankfurt_move');await expect(departure).toHaveAttribute('data-selected','true');
 await page.locator('#search').fill('event.frankfurt_move');await expect(page.locator('[data-record-id="event.frankfurt_move"]')).toHaveCount(2);
 await page.locator('#search').fill('process.frankfurt_stay');await expect(flight).toHaveCount(1);await expect(arrival).toHaveCount(1);
});
test('Agreement buttons precede dates and open agreement-owned clauses',async({page})=>{
 await ready(page);
 for(const id of ['event.dri_founding','process.computer_business_incorporation']){
  const card=page.locator('#timeline [data-record-id="'+id+'"]'),button=card.locator(':scope > .timeline-meta > .timeline-agreement');
  await expect(button).toHaveText('Agreement');expect(await button.evaluate(n=>n.nextElementSibling.classList.contains('timeline-date'))).toBe(true);
  await button.click();await expect(page.locator('#details .record-id')).toHaveText('agreement.dri_founding');await expect(page.locator('#details')).toContainText('clause.dri_employee_reserve');
 }
 await expect(page.locator('[data-record-id="event.identity"] > .timeline-meta > .timeline-agreement')).toHaveCount(0);
});
test('older agreement lists open only the first agreement',async({page})=>{
 await page.route('**/data_foundation/event.json',async route=>{const response=await route.fetch(),body=await response.json(),event=body.event.find(e=>e.id==='event.logix_share_transfer_1978');delete event.agreement_id;event.agreement_ids=['agreement.logix_share_transfer_1978','agreement.aionix'];await route.fulfill({json:body});});
 await ready(page);const button=page.locator('[data-record-id="event.logix_share_transfer_1978"] > .timeline-meta > .timeline-agreement');await expect(button).toHaveCount(1);await button.click();await expect(page.locator('#details .record-id')).toHaveText('agreement.logix_share_transfer_1978');
});
