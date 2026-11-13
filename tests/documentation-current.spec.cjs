const {test,expect}=require('@playwright/test');
test('documentation viewer exposes the current standards, market and calculation guides',async({page})=>{
 const cases=[['campaign-contract','Campaign timelines — current contract','Campaign timelines — contract 0.21.0'],['ecosystem-standards','External products and core standards','External products and standards'],['market-responses','Market-response impact sections','Market responses and impact sections'],['annual-sales-guide','Annual sales — calculation guide','Annual sales estimates'],['annual-sales','Calculation · annual sales','annual_sales']];
 for(const [id,title,content] of cases){await page.goto('/docs/viewer.html#'+id);await expect(page.locator('#title')).toHaveText(title);await expect(page.locator('#content')).toContainText(content);await expect(page.locator('#status')).toBeEmpty();}
 await expect(page.locator('#navigation a[href="#migration_authorization_decision_index"]')).toBeVisible();
});
