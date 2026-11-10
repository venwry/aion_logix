const {test,expect}=require('@playwright/test');
test('current cleanup proposals and updated issue assessments are visible in Changes confirm',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/code/changes-confirm.html');await expect(page.locator('body')).toHaveAttribute('data-ready','true');
 await page.locator('#search').fill('Remove universally empty fields — software_edition');
 await expect(page.locator('.proposal-nav-item')).toHaveCount(1);
 await page.locator('.proposal-nav-item').click();
 await expect(page.locator('.proposal-card')).toContainText('Remove only explicit nulls and empty lists');
 await expect(page.locator('.change-table')).toContainText('application_ram_bytes');
 await expect(page.getByRole('button',{name:'Authorize',exact:true})).toBeEnabled();
 await page.locator('#search').fill('Review 463 foundation records');
 await page.locator('.proposal-nav-item').click();
 await expect(page.locator('.proposal-card')).toContainText('626 are authorized');
 await expect(page.getByRole('button',{name:'Authorize',exact:true})).toBeDisabled();
 await page.locator('#search').fill('Reconcile the 17 inherited issue records');
 await expect(page.locator('.proposal-nav-item')).toHaveCount(0);expect(errors).toEqual([]);
});
