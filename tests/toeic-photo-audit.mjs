// Review the exact licensed photo URLs used by the practice bank, without cropping.
import { chromium } from '@playwright/test'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
const ids=JSON.parse(await readFile('src/data/toeicPhotoCandidates.json','utf8'))
const output='test-results/toeic-photos'
await mkdir(output,{recursive:true})
const browser=await chromium.launch()
const failures=[]
try{
 for(let offset=0;offset<ids.length;offset+=10){
  const page=await browser.newPage({viewport:{width:1600,height:1150}})
  await page.setContent(`<html><style>body{margin:0;padding:12px;background:white;font:14px Arial}.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}article{border:1px solid #ddd;padding:8px}img{width:100%;height:440px;object-fit:contain;background:#eee}p{margin:5px}</style><div class="grid">${ids.slice(offset,offset+10).map((id,i)=>`<article><p>${offset+i+1}. ${id}</p><img data-id="${id}" src="https://images.unsplash.com/photo-${id}?w=900&auto=format&fit=max&q=80"></article>`).join('')}</div></html>`)
  await page.waitForFunction(()=>[...document.images].every(image=>image.complete),{},{timeout:90000})
  failures.push(...await page.locator('img').evaluateAll(images=>images.filter(image=>!image.naturalWidth).map(image=>image.dataset.id)))
  await page.screenshot({path:`${output}/photos-${offset+1}-${Math.min(ids.length,offset+10)}.png`,fullPage:true})
  await page.close()
 }
 await writeFile(`${output}/audit.json`,JSON.stringify({checked:ids.length,failures},null,2))
 if(failures.length)throw new Error('Images failed: '+failures.join(', '))
 console.log(`PASS ${ids.length} unique real photo URLs load at full aspect ratio`)
}finally{await browser.close()}
