const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const manifest=JSON.parse(fs.readFileSync('data_storytelling/manifest.json')).manifest[0];
const collections=Object.fromEntries(manifest.foundation_datasets.map(type=>[type,JSON.parse(fs.readFileSync('data_foundation/'+(manifest.foundation_files?.[type]||type+'.json')))[type]]));
const chapter={number:1,chapter_name:'Interface',description:'Uses\n{bus}\nwith {count} ports.\n\nA separate explanation.',parameters:[{key:'bus',value:'technology.flexibus'},{key:'count',value:'2'}]};
const technical={chapters:[{number:1,chapter_name:'Interface',description:chapter.description}],parameters:[{key:'bus',ref_id:'technology.flexibus',ref_role:'Peripheral connection standard'},{key:'count',value:2}]};
const fixtures=[
 ['technology','technology.flexibus',r=>({...r,specification:[chapter,{number:2,chapter_name:'Scope',description:'No extra parameters.',parameters:[]}]} )],
 ['device','device.artemis_video_card_64kb',r=>({...r,technical_specification:technical,graphic_modes_specification:[{id:'test',description:'Uses\n{bus}\nfor {width} pixels.',type:'bitmap',width:320,height:200,framebuffer_size:16000,double_buffering:false,sprites_available:false,parameters:[{key:'bus',ref_id:'technology.flexibus',ref_role:'Fixture reference'}]}]})],
 ['base_part','base_part.erav1_6mhz',r=>({...r,technical_specification:technical})],
 ['software_edition',collections.software_edition[0].id,r=>({...r,technical_specification:technical})],
 ['campaign','campaign.ncc1978',r=>({...r,marketing_steps:[{id:'step1',number:1,type:'presentation',description:'Demonstration',marketing_presentation:[{number:1,description:chapter.description,parameters:chapter.parameters}]}]})],
 ['external_product','external_product.model_ii_flexibus',r=>({...r,specification:[chapter],impacted_standards:[{standard_id:'technology.flexibus',date:'1980',assumption_description:'Uses\n{bus}\nfor a connection.',comparison_description:'Supports {count} ports.',outcomes_description:'Explains compatibility.',parameters:chapter.parameters}]})]
].map(([type,id,modify])=>{const before=modify(structuredClone(collections[type].find(r=>r.id===id)));return {record_type:type,record_id:id,before,after:{...before,description:'Rendering comparison fixture'}};});
async function checkProse(scope){
 const descriptions=scope.locator('.specification-description');expect(await descriptions.count()).toBeGreaterThan(0);
 for(const description of await descriptions.all()){
  const paragraph=description.locator(':scope > p').first();await expect(paragraph).toHaveCSS('display','inline');await expect(paragraph).toHaveCSS('white-space','normal');
  await expect(paragraph).toHaveCSS('font-weight','400');
  for(const link of await description.locator('.reference-name').all())await expect(link).toHaveCSS('display','inline');
  for(const id of await description.locator('.reference-id').all())await expect(id).toBeHidden();
  const text=await description.innerText();expect(text).not.toContain('technology.flexibus');expect(text).not.toMatch(/\n\s*FlexiBUS|FlexiBUS\s*\n/);
 }
 // Short fixture headings and the opening words share a line, not a forced paragraph break.
 for(const card of await scope.locator('.specification-chapter,.standard-impact').all()){
  const heading=card.locator(':scope > .specification-chapter-heading');if(!await heading.count())continue;
  await expect(heading).toHaveCSS('display','inline');
  const aligned=await card.evaluate(card=>{const h=card.querySelector('.specification-chapter-heading'),p=card.querySelector('.specification-description p'),walker=document.createTreeWalker(p,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode())if(node.textContent.trim())break;const range=document.createRange();range.setStart(node,0);range.setEnd(node,Math.min(4,node.length));const a=[...h.getClientRects()].at(-1),b=range.getBoundingClientRect();return a.top<b.bottom&&b.top<a.bottom;});expect(aligned).toBe(true);
 }
 await expect(scope.locator('.specification-unresolved')).toHaveCount(0);
}
for(const view of ['browser','timeline','changes-confirm'])test(view+' uses flowing chapter headings and inline named references across all parameterized descriptions',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 if(view==='changes-confirm'){
  await page.addInitScript(()=>sessionStorage.setItem('aion-backend',JSON.stringify({url:'https://aion-review-zu1t.onrender.com',token:'test-key'})));
  await page.route('**/api/state',r=>r.fulfill({json:{revision:'inline-fixture',collections,authorization:[],changes:{change:[{id:'change.inline',category:'foundation',title:'Inline descriptions',reason:'Display fixture',elements:fixtures}]}}}));
  await page.route('**/api/authorize',r=>r.abort());await page.goto('/code/changes-confirm.html');await expect(page.locator('body')).toHaveAttribute('data-ready','true');await page.getByLabel('Comparison',{exact:true}).selectOption('details');
 }else{
  for(const [type,records] of Object.entries(collections))await page.route('**/data_foundation/'+(manifest.foundation_files?.[type]||type+'.json'),r=>r.fulfill({json:{[type]:records.map(record=>fixtures.find(e=>e.record_id===record.id)?.before||record)}}));
 }
 for(const [i,element] of fixtures.entries()){
  if(view==='changes-confirm')await page.getByLabel('Affected record',{exact:true}).selectOption(String(i));
  else{await page.goto('/code/'+view+'.html#'+element.record_id);await expect(page.locator('body')).toHaveAttribute('data-ready','true');}
  const scopes=view==='changes-confirm'?await page.locator('.comparison-record').all():[page.locator('#details')];
  for(const scope of scopes)await checkProse(scope);
 }
 const scope=view==='changes-confirm'?page.locator('.comparison-record').last():page.locator('#details');
 const chapter=scope.locator('.specification-chapter').first();await expect(chapter.locator('table')).toBeHidden();await chapter.getByRole('button').click();await expect(chapter.locator('table .reference-id')).toBeVisible();
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const link=chapter.locator('.specification-description .reference-name');await link.click();await expect(scope.locator('h2')).toHaveText('FlexiBUS');expect(errors).toEqual([]);
});
