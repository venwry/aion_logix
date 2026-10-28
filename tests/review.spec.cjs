const {test,expect}=require('@playwright/test');
const fs=require('node:fs/promises');
async function ready(page,path){await page.goto('/code/'+path);await expect(page.locator('body')).toHaveAttribute('data-ready','true');}
async function download(page,button){const pending=page.waitForEvent('download');await button.click();const file=await pending;return JSON.parse(await fs.readFile(await file.path(),'utf8'));}
test('record confirmations survive reload, revoke and export exact snapshots',async({page})=>{
 await ready(page,'browser.html#event.identity');
 const checkbox=page.getByRole('checkbox',{name:'I agree to set this record to confirmed'});
 await checkbox.check();await expect(page.locator('.review-toolbar')).toContainText('1 record confirmation');
 await page.reload();await expect(checkbox).toBeChecked();
 const log=await download(page,page.getByRole('button',{name:'Download confirmation log'}));
 expect(log.kind).toBe('record-confirmations');expect(log.decisions).toHaveLength(1);
 expect(log.decisions[0]).toMatchObject({action:'confirm_record',record_id:'event.identity',requested_status:'confirmed',record:{id:'event.identity',status:'pending confirmation'}});
 expect(log.decisions[0].record_sha256).toMatch(/^[0-9a-f]{64}$/);
 await checkbox.uncheck();await expect(page.getByRole('button',{name:'Download confirmation log'})).toBeDisabled();
});
test('remaining founder proposal shows before/after and exports approvals',async({page})=>{
 await ready(page,'changes-confirm.html');
 const proposal=page.locator('[data-change-id="change.autodesk_founder_representation"]');
 await expect(proposal.locator('.proposal-element')).toHaveCount(3);
 await proposal.locator('.proposal-element summary').first().click();
 await expect(proposal.locator('.compare-column').first()).toContainText('Not present');
 await expect(proposal.locator('.compare-column').nth(1)).toContainText('John Walker');
 await proposal.getByRole('checkbox').check();
 const log=await download(page,page.getByRole('button',{name:'Download approval log'}));
 expect(log.decisions).toHaveLength(1);expect(log.decisions[0].action).toBe('approve_change');
 expect(log.decisions[0].proposal.elements[0].after).toHaveProperty('source_refs');
 await page.reload();await expect(page.locator('#review-count')).toContainText('1 approved');
 await page.locator('#category').selectOption('schema');await expect(page.locator('.proposal-card')).toHaveCount(0);
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('changed story snapshots invalidate stored record confirmations',async({page})=>{
 await ready(page,'browser.html#event.identity');await page.getByRole('checkbox').check();
 await page.route('**/data_foundation/event.json',async route=>{const response=await route.fetch();const doc=await response.json();doc.event.find(r=>r.id==='event.identity').title='Changed arrival';await route.fulfill({json:doc});});
 await page.reload();await expect(page.locator('body')).toHaveAttribute('data-ready','true');
 await expect(page.getByRole('checkbox')).not.toBeChecked();await expect(page.locator('.review-warning')).toContainText('outdated');
});
test('stale proposals cannot be approved or exported',async({page})=>{
 await ready(page,'changes-confirm.html');await page.locator('[data-change-id="change.autodesk_founder_representation"]').getByRole('checkbox').check();
 await page.route('**/data_foundation/event.json',async route=>{const response=await route.fetch();const doc=await response.json();doc.event.find(r=>r.id==='event.autodesk_agreement').title='Changed offer';await route.fulfill({json:doc});});
 await page.reload();await expect(page.locator('body')).toHaveAttribute('data-ready','true');
 const check=page.locator('[data-change-id="change.autodesk_founder_representation"]').getByRole('checkbox');await expect(check).toBeDisabled();await expect(check).not.toBeChecked();await expect(page.locator('#download')).toBeDisabled();
});
test('changed proposal wording requires renewed approval',async({page})=>{
 await ready(page,'changes-confirm.html');await page.locator('[data-change-id="change.autodesk_founder_representation"]').getByRole('checkbox').check();
 await page.route('**/review/proposals.json',async route=>{const response=await route.fetch();const doc=await response.json();doc.change[0].reason+=' Revised recommendation.';await route.fulfill({json:doc});});
 await page.reload();await expect(page.locator('body')).toHaveAttribute('data-ready','true');await expect(page.locator('[data-change-id="change.autodesk_founder_representation"]').getByRole('checkbox')).not.toBeChecked();await expect(page.locator('#download')).toBeDisabled();
});
test('approval export works when local storage is unavailable',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.setItem=function(){throw new Error('Storage unavailable');};});
 await ready(page,'browser.html#event.identity');await page.getByRole('checkbox').check();await expect(page.locator('.review-warning')).toContainText('this visit only');
 const log=await download(page,page.getByRole('button',{name:'Download confirmation log'}));expect(log.decisions).toHaveLength(1);
});
