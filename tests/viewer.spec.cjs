const {test,expect}=require('@playwright/test');
test('documentation, diagrams, JSON and active prototype',async({page})=>{
 await page.goto('/docs/viewer.html');
 await expect(page.locator('article h1')).toContainText('data model principles');
 await expect(page.locator('.diagram svg')).toBeVisible();
 await page.getByRole('button',{name:'Kod źródłowy'}).click();
 await expect(page.locator('#content pre')).toContainText('```mermaid');
 await page.getByRole('button',{name:'Podgląd',exact:true}).click();
 await page.getByRole('link',{name:'Interaktywny przykład'}).click();
 const frame=page.frameLocator('iframe');
 await frame.getByRole('button',{name:'Następny rok'}).click();
 await expect(frame.locator('#year')).toHaveText('1971');
 await page.getByRole('link',{name:'Przykładowy zbiór danych'}).click();
 await expect(page.locator('#content')).toContainText('actor.example_person');
 await expect(page.locator('#content details').first()).toBeVisible();
});
test('local files, invalid JSON, sanitized Markdown and sandbox',async({page})=>{
 await page.goto('/docs/viewer.html');
 await expect(page.locator('article h1')).toBeVisible();
 await page.locator('#file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{bad')});
 await expect(page.getByRole('status')).toContainText('Błąd podglądu');
 await page.locator('#file').setInputFiles({name:'safe.md',mimeType:'text/markdown',buffer:Buffer.from('# Local document\n<script>window.attacked=true</script><img src=x onerror="window.attacked=true">')});
 await expect(page.locator('article h1')).toHaveText('Local document');
 expect(await page.evaluate(()=>window.attacked)).toBeUndefined();
 await page.locator('#file').setInputFiles({name:'demo.js',mimeType:'text/javascript',buffer:Buffer.from('document.body.textContent="JS works";try {parent.document.body.dataset.attacked="yes"}catch(e){}')});
 await expect(page.frameLocator('iframe').locator('body')).toHaveText('JS works');
 expect(await page.locator('body').getAttribute('data-attacked')).toBeNull();
});
test('schema design diagrams and independently stored DRI clauses',async({page})=>{
 await page.goto('/docs/viewer.html#schemas');
 await expect(page.locator('article h1')).toContainText('schema design');
 await expect(page.locator('.diagram svg')).toHaveCount(3);
 await expect(page.getByRole('status')).toBeEmpty();
 await page.getByRole('link',{name:'DRI — six proposed clauses'}).click();
 await expect(page.locator('#content')).toContainText('clause.dri_employee_reserve');
 await expect(page.locator('#content')).toContainText('unallocated_reserve');
});
test('migrated phase-one data and review report are accessible',async({page})=>{
 await page.goto('/docs/viewer.html#migration-report');
 await expect(page.locator('article h1')).toHaveText('Phase-1 migration audit');
 await expect(page.locator('article')).toContainText('Migration draft, not confirmed canon');
 await page.getByRole('link',{name:'Data · clause',exact:true}).click();
 await expect(page.locator('#content')).toContainText('clause.autodesk_development_rights');
 await expect(page.locator('#content')).toContainText('pending confirmation');
 await page.getByRole('link',{name:'Data · reconciliation issue',exact:true}).click();
 await expect(page.locator('#content')).toContainText('reconciliation_issue.bpi_investment_wording');
});
