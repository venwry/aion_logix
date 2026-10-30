const {test,expect}=require('@playwright/test');
async function ready(page){await page.goto('/code/timeline.html');await expect(page.locator('body')).toHaveAttribute('data-ready','true');}
test('process containers nest milestones, merge campaign execution and cross year lines',async({page})=>{
 await ready(page);
 const campaign=page.locator('#timeline [data-record-id="campaign.ncc1978"]');
 await expect(campaign).toHaveCount(1);
 await expect(page.locator('#timeline [data-record-id="process.ncc1978_campaign"]')).toHaveCount(0);
 await expect(campaign.locator(':scope > .timeline-meta')).toContainText('Campaign / Process');
 await expect(campaign.locator('[data-record-id="event.aurelia_launch"]')).toHaveCount(1);
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
