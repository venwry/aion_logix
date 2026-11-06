const {test,expect}=require('@playwright/test');
// Stable approved-category fixture; pending proposals disappear after authorization.
const categories={
 "event.time_travel_arrival": "Adam's personal",
 "process.birmingham_estate": "Adam's personal",
 "process.frankfurt_stay": "Adam's personal",
 "process.stock_market_investment": "Adam's personal",
 "process.harvard_education": "Adam's personal",
 "process.computer_business_incorporation": "Logix/AION investment",
 "process.stepper_install": "Logix/AION investment",
 "process.aurelia_foundation": "Product dev & launch",
 "process.ncc1979_development": "Product dev & launch",
 "process.comdex1979_campaign": "Product dev & launch",
 "process.artemis_development": "Product dev & launch",
 "process.native_abacus_pulse_development": "Product dev & launch",
 "process.artemis_networking_development": "Product dev & launch",
 "process.team_edition_server_development": "Product dev & launch",
 "process.autodesk_development": "Product dev & launch",
 "process.ncc1982_campaign": "Product dev & launch",
 "process.comdex1982_campaign": "Product dev & launch",
 "process.era2_development": "Product dev & launch",
 "process.open_compatibility": "Ecosystem & Partners",
 "process.clone_second_source_development": "Ecosystem & Partners",
 "process.clone_january1982_campaign": "Ecosystem & Partners",
 "process.artemis_ecosystem": "Ecosystem & Partners",
 "process.athena_ecosystem": "Ecosystem & Partners",
 "process.apple_business_response": "Competition",
 "process.ibm_project_chess": "Competition"
};
async function ready(page,approved=true){
 for(const type of ['event','process'])await page.route('**/data_foundation/'+type+'.json',async route=>{
  const doc=await (await route.fetch()).json();
  doc[type]=doc[type].map(r=>{const copy={...r};delete copy.category;if(approved&&categories[r.id])copy.category=categories[r.id];return copy;});
  await route.fulfill({json:doc});
 });
 await page.goto('/code/timeline.html');await expect(page.locator('body')).toHaveAttribute('data-ready','true');
}
test('approved categories create five colored lanes with inherited cards and campaign aliases',async({page})=>{
 await ready(page);await expect(page.locator('.lane-toggle')).toHaveCount(5);
 expect(new Set(await page.locator('.timeline-lane').evaluateAll(ns=>ns.map(n=>getComputedStyle(n).backgroundColor))).size).toBe(5);
 await expect(page.locator('[data-group-id="process.harvard_education"]')).toHaveAttribute('data-lane','personal');
 await expect(page.locator('[data-group-id="campaign.clone_january1982"]')).toHaveAttribute('data-lane','ecosystem');
 const errors=await page.evaluate(()=>[...document.querySelectorAll('.timeline-group')].filter(g=>{const lane=document.querySelector('.timeline-lane[data-lane="'+g.dataset.lane+'"]'),a=g.getBoundingClientRect(),b=lane.getBoundingClientRect();return a.left<b.left||a.right>b.right;}).map(g=>g.dataset.groupId));expect(errors).toEqual([]);
 await page.locator('#search').fill('event.harvard_graduation');await expect(page.locator('.timeline-group')).toHaveCount(1);await expect(page.locator('.timeline-group')).toHaveAttribute('data-lane','personal');
});
test('collapse and keyboard expand preserve shared anchors, details and mobile controls',async({page})=>{
 await ready(page);const anchor=await page.locator('[data-record-id="event.dri_founding"].timeline-card').getAttribute('data-anchor');
 const button=page.locator('.lane-toggle[data-lane="personal"]');await button.click();await expect(button).toHaveAttribute('aria-expanded','false');await expect(page.locator('.timeline-group[data-lane="personal"]')).toHaveCount(0);
 expect(await page.locator('[data-record-id="event.dri_founding"].timeline-card').getAttribute('data-anchor')).toBe(anchor);
 await button.focus();await page.keyboard.press('Enter');await expect(page.locator('.timeline-group[data-lane="personal"]')).toHaveCount(5);
 await page.setViewportSize({width:390,height:844});await page.locator('#timeline-fullscreen').click();await expect(button).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 for(const id of ['personal','investment','product','ecosystem','competition'])await page.locator('.lane-toggle[data-lane="'+id+'"]').click();
 await expect(page.locator('#timeline')).toContainText('Matching lanes are collapsed');await expect(page.locator('.timeline-group')).toHaveCount(0);
 await page.locator('.lane-toggle[data-lane="personal"]').click();await expect(page.locator('.timeline-group')).toHaveCount(5);
});
test('unapproved assignments remain in a sixth lane',async({page})=>{
 await ready(page,false);await expect(page.locator('.lane-toggle')).toHaveCount(6);await expect(page.locator('.timeline-group:not([data-lane="uncategorised"])')).toHaveCount(0);
});
