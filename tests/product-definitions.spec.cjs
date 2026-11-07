const {test,expect}=require('@playwright/test');
test('new technical datasets are browsable and pending authorization',async({page})=>{
 await page.goto('/code/browser.html#base_part.erav1_6mhz');await expect(page.locator('body')).toHaveAttribute('data-ready','true');
 await expect(page.locator('#details h2')).toHaveText('ERAv1 6MHz (initial)');await expect(page.locator('#details .badge')).toHaveText('Pending authorization');
 for(const n of ['base_part','device','software_edition'])await expect(page.locator('#dataset option[value="'+n+'"]').first()).toHaveCount(1);
 await page.locator('#dataset').selectOption('device');await page.locator('#search').fill('device.ram_64kb_x32');await page.locator('#rows tr[data-record-id="device.ram_64kb_x32"]').click();await expect(page.locator('#details h2')).toHaveText('Logix 64 KB 32-bit DRAM module');await expect(page.getByLabel('Composition history')).toBeVisible();await expect(page.locator('#details')).toContainText('unknown');
});
test('existing products have reviewable before and after compositions',async({page})=>{
 await page.goto('/code/changes-confirm.html');await expect(page.locator('body')).toHaveAttribute('data-ready','true');
 await page.locator('#search').fill('Product definition — Logix Artemis 128 KB — Monochrome system');
 await expect(page.locator('.proposal-card')).toHaveCount(1);await expect(page.locator('.change-table')).toContainText('composition_history');
 await expect(page.getByRole('checkbox',{name:'I authorize this change'})).toHaveCount(1);
});
