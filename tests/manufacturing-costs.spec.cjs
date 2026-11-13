const {test,expect}=require('@playwright/test');const fs=require('node:fs');
const costs=JSON.parse(fs.readFileSync('data_calculation/manufacturing_costs.json'));
async function open(page){await page.goto('/code/manufacturing-costs.html');await expect(page.locator('body')).toHaveAttribute('data-ready','true');}
test('all products and twelve dated columns render, with exact pre-launch blanks',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await open(page);
 await expect(page.locator('#cost-table thead th')).toHaveCount(13);await expect(page.locator('#cost-table tbody tr')).toHaveCount(costs.manufacturing_costs.length);
 await expect(page.locator('#cost-table thead th').nth(1)).toHaveText('15 Jun 1978');await expect(page.locator('#cost-table thead th').last()).toHaveText('15 Dec 1983');
 const course=page.locator('tr[data-product-id="product.academy_course_1"]');await expect(course.locator('td[data-date="1978-06-15"]')).toBeEmpty();await expect(course.locator('td[data-date="1978-12-15"] button')).toHaveText('$71.65');
 const athena=page.locator('tr[data-product-id="product.athena"]');await expect(athena.locator('td.prelaunch')).toHaveCount(10);await expect(athena.locator('td button')).toHaveCount(2);
 await expect(page.locator('#cost-staleness')).toBeHidden();expect(errors).toEqual([]);
});
test('cell opens reproducible breakdown, quantities and fabrication inputs; Escape restores the grid',async({page})=>{
 await open(page);const cell=page.locator('tr[data-product-id="product.aurelia_mono"] td[data-date="1978-06-15"] button');await cell.click();await expect(page.getByRole('dialog')).toBeVisible();await expect(page.locator('#cost-detail')).toContainText('Service delivery provision');await expect(page.locator('#cost-detail')).toContainText('nominal USD at this date');
 await page.getByText('Components and cost assumptions',{exact:true}).click();await expect(page.locator('#cost-detail')).toContainText('190 candidate die');await expect(page.locator('#cost-detail')).toContainText('electrical yield 60.0%');await expect(page.locator('#cost-detail')).toContainText('104');await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toBeHidden();await expect(cell).toBeFocused();
});
test('search, category filter and CSV preserve the date grid and empty cells',async({page})=>{
 await open(page);await page.getByLabel('Find a product').fill('Academy');await page.getByLabel('Offering',{exact:true}).selectOption('service');await expect(page.locator('#cost-table tbody tr')).toHaveCount(4);
 const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Download CSV'}).click();const download=await downloaded;expect(download.suggestedFilename()).toBe('manufacturing-costs-1978-1983.csv');const csv=fs.readFileSync(await download.path(),'utf8');expect(csv).toContain('"1978-06-15","1978-12-15"');expect(csv).toContain('"Nominal USD at column date","","71.65"');
});
test('stale foundation is visible and disables a misleading live recalculation',async({page})=>{
 await page.route('**/data_foundation/product.json',async route=>{const response=await route.fetch(),d=await response.json();d.product.find(p=>p.id==='product.aurelia_mono').description+=' Changed fixture.';await route.fulfill({json:d});});
 await open(page);await expect(page.locator('#cost-staleness')).toBeVisible();await expect(page.getByRole('button',{name:'RAM comparisons',exact:true})).toBeDisabled();await page.locator('tr[data-product-id="product.aurelia_mono"] td button').first().click();await expect(page.locator('#cost-detail')).toContainText('Detailed recalculation is disabled');await expect(page.getByText('Components and cost assumptions',{exact:true})).toHaveCount(0);
});
test('saving-service visibility persists and the grid remains usable at a narrow viewport',async({page})=>{
 await page.setViewportSize({width:900,height:850});await open(page);await page.getByRole('button',{name:'Saving service',exact:true}).click();await expect(page.locator('#backend-connection')).toBeHidden();
 const first=page.locator('#cost-table tbody th').first(),x=await first.evaluate(n=>n.getBoundingClientRect().x);await page.locator('.cost-table-scroll').evaluate(n=>n.scrollLeft=500);expect(Math.abs((await first.evaluate(n=>n.getBoundingClientRect().x))-x)).toBeLessThan(2);
 await page.screenshot({path:'/tmp/manufacturing-costs.png'});await page.getByRole('link',{name:'Product Catalog',exact:true}).click();await expect(page.locator('#backend-connection')).toBeHidden();await expect(page.getByRole('link',{name:'Manufacturing costs',exact:true})).toBeVisible();
});

test('RAM comparisons expose dated sources, complete module costs and host restrictions',async({page})=>{
 await open(page);await page.getByRole('button',{name:'RAM comparisons',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('15% markup');
 const date=page.getByLabel('RAM comparison date');await date.selectOption('1980-06-15');await expect(page.getByRole('dialog')).toContainText('Commercial 16K');await expect(page.getByRole('dialog')).toContainText('Logix Artemis');await expect(page.getByRole('dialog')).not.toContainText('Logix Athena');
 await date.selectOption('1983-12-15');await expect(page.getByRole('dialog')).toContainText('Logix Athena Server');await page.screenshot({path:'/tmp/ram-cost-comparison.png'});await page.getByRole('dialog').locator('details').last().locator('summary').click();await expect(page.getByRole('dialog')).toContainText('qualification');
 await page.keyboard.press('Escape');await page.locator('tr[data-product-id="product.aurelia_mono"] td button').first().click();await expect(page.getByRole('dialog')).toContainText('AION Labs 15% chip markup');await page.getByRole('button',{name:'Compare RAM alternatives at this date'}).click();await expect(page.getByLabel('RAM comparison date')).toHaveValue('1978-06-15');
});
