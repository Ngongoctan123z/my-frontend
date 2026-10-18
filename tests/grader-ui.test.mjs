// Exercise the actual grader clients and production CSS with deterministic API/auth fixtures.
// No production account, submitted history, or paid AI calls are used.
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { chromium } from '@playwright/test'
import { createServer } from 'node:http'
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { existsSync } from 'node:fs'

const output = 'test-results/grader-ui'
await mkdir(output, { recursive: true })
const cssNames = (await readdir('.next/static/css', { recursive: true })).filter(name => name.endsWith('.css'))
const css = (await Promise.all(cssNames.map(name => readFile(path.join('.next/static/css', name), 'utf8')))).join('\n')
const entry = `
import React from 'react'; import { createRoot } from 'react-dom/client';
import { AiGraderClient } from './app/ai-grader/ielts/AiGraderClient';
import { ToeicGraderClient } from './app/ai-grader/toeic/ToeicGraderClient';
import { TopikGraderClient } from './app/ai-grader/topik/TopikGraderClient';
import { HskGraderClient } from './app/ai-grader/hsk/HskGraderClient';
import { ChatWidget } from './src/components/chat/ChatWidget';
import * as fixtures from './src/data/fallbackPrompts';
window.requests=[];
window.fetch=async (url,options={})=>{
  const body=options.body ? JSON.parse(options.body) : {};
  window.requests.push({url,body});
  let result={count:0,limit:50,plan:'free'};
  if(body.action==='get_paired_full_test') result={sets:fixtures[body.exam+'_PAIRED_SETS']};
  if(body.action==='generate_prompt_batch') result={prompts:fixtures[body.type+'_FALLBACKS'] || []};
  if(body.action==='grade') return new Promise(()=>{});
  return new Response(JSON.stringify(result),{headers:{'content-type':'application/json'}});
};
const key=new URL(location.href).searchParams.get('exam');
createRoot(document.getElementById('root')).render(React.createElement({ielts:AiGraderClient,toeic:ToeicGraderClient,topik:TopikGraderClient,hsk:HskGraderClient,dock:ChatWidget}[key]));
`
const stubs = {
  'next-auth/react': `const session={user:{email:'ui-test@example.invalid'}}; export const useSession=()=>({data:session,status:'authenticated'}); export const signIn=()=>{};`,
  'next/navigation': `export const usePathname=()=>location.pathname;`,
  'next/dynamic': `import React from 'react'; export default function dynamic(loader){const C=React.lazy(loader.then ? ()=>loader : ()=>loader().then(defaultExport=>({default:defaultExport}))); return props=>React.createElement(React.Suspense,{fallback:null},React.createElement(C,props));}`,
  '@/src/utils/indexedDB': `export const getEssayHistory=async()=>[]; export const saveEssayHistory=async()=>{}; export const clearEssayHistory=async()=>{};`,
}
for (const name of ['GradingResultModal','ShareExamModal','StudentManagementModal']) {
  stubs['@/src/components/common/'+name] = `export const ${name}=()=>null;`
}
for (const name of ['CalculatorBubble','TranslateBubble','ChatBubble']) {
  stubs[name] = `import React from 'react'; export const ${name}=({onClose})=>React.createElement('div',{role:'dialog','aria-label':'${name}'},React.createElement('button',{onClick:onClose},'Đóng'));`
}
const bundle = await build({
  stdin: { contents: entry, resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, write: false,
  format: 'iife', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' },
  plugins: [{ name: 'test-fixtures', setup(builder) {
    builder.onResolve({ filter: /^(next-auth\/react|next\/navigation|next\/dynamic|@\/src\/utils\/indexedDB)$/ }, args => ({ path: args.path, namespace: 'fixture' }))
    builder.onResolve({ filter: /\/(CalculatorBubble|TranslateBubble|ChatBubble)$/ }, args => ({path:args.path.split('/').pop(),namespace:'fixture'}))
    builder.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: stubs[args.path], loader: 'js', resolveDir: process.cwd() }))
    builder.onResolve({ filter: /^@\// }, args => {
      if(stubs[args.path]) return {path:args.path,namespace:'fixture'}
      const base=path.resolve(args.path.replace(/^@\//, ''))
      return {path:['.tsx','.ts','/index.ts','/index.tsx'].map(ext=>base+ext).find(candidate=>existsSync(candidate)) || base}
    })
  } }],
})
const server = createServer((request, response) => {
  if(request.url === '/app.js') { response.setHeader('Content-Type','text/javascript'); response.end(bundle.outputFiles[0].text); return }
  if(request.url === '/style.css') { response.setHeader('Content-Type','text/css'); response.end(css); return }
  response.setHeader('Content-Type','text/html')
  response.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><main id="root" class="mx-auto max-w-7xl"></main><script src="/app.js"></script>')
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const browser = await chromium.launch({ headless: true })
let checks=0
let activePage
try {
  for(const width of [320,375,576,1280]) {
    for(const exam of ['ielts','toeic','topik','hsk']) {
      const page=await browser.newPage({viewport:{width,height:900}})
      activePage=page
      const errors=[]
      page.on('pageerror',error=>errors.push(error.message))
      await page.goto(`http://127.0.0.1:${server.address().port}/?exam=${exam}`)
      await page.getByRole('heading',{level:2}).waitFor()
      assert.equal(await page.getByText(/Tiến trình thi trọn bộ:|Full Test Flow:|Các phần thi HSK 5:/).count(),0)
      const assertLayout=async()=>{
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`${exam}/${width}: page overflows`)
        const actions=page.locator('[data-grader-actions]:visible')
        if(await actions.count()) {
          const label=actions.getByLabel('Ngôn ngữ nhận xét',{exact:true})
          assert.equal(await label.count(),1)
          const clipped=await actions.locator('button').evaluateAll(buttons=>buttons.filter(b=>b.getBoundingClientRect().width>0).some(b=>b.scrollWidth>b.clientWidth+1))
          assert.equal(clipped,false,`${exam}/${width}: clipped action button`)
        }
      }
      const clearOne=async(label,text='Test answer 한국어 中文')=>{
        const field=page.getByRole('textbox',{name:label,exact:true}).filter({visible:true})
        await field.fill(text)
        await page.getByRole('button',{name:'Xóa nội dung: '+label,exact:true}).filter({visible:true}).click()
        assert.equal(await field.inputValue(),'')
        assert.equal(await field.evaluate(node=>document.activeElement===node),true)
        checks++
      }
      if(exam==='topik') {
        await page.getByRole('textbox',{name:'TOPIK ㉠',exact:true}).fill('첫 번째')
        await page.getByRole('textbox',{name:'TOPIK ㉡',exact:true}).fill('두 번째')
        await clearOne('TOPIK ㉠')
        assert.equal(await page.getByRole('textbox',{name:'TOPIK ㉡',exact:true}).inputValue(),'두 번째')
        await clearOne('TOPIK ㉡')
        await page.getByRole('button',{name:'Chuyển sang Câu 52 →',exact:true}).click()
        await clearOne('TOPIK ㉠')
        await clearOne('TOPIK ㉡')
        await page.getByRole('button',{name:'Chuyển sang Câu 53 →',exact:true}).click()
        await clearOne('TOPIK 53')
        await page.getByRole('button',{name:'Chuyển sang Câu 54 →',exact:true}).click()
        await clearOne('TOPIK 54')
      } else if(exam==='hsk') {
        await page.getByRole('textbox',{name:'HSK 91',exact:true}).filter({visible:true}).waitFor()
        await page.getByRole('textbox',{name:'HSK 92',exact:true}).filter({visible:true}).fill('保留这个答案')
        await clearOne('HSK 91')
        assert.equal(await page.getByRole('textbox',{name:'HSK 92',exact:true}).filter({visible:true}).inputValue(),'保留这个答案')
        for(let q=92;q<=98;q++) await clearOne('HSK '+q)
        const next=page.getByRole('button',{name:/Chuyển sang (Phần|Part) 2/}).filter({visible:true})
        await next.first().click()
        await clearOne('HSK 99')
        await page.getByRole('button',{name:'Chuyển sang Phần 3 →',exact:true}).click()
        await clearOne('HSK 100')
        await assertLayout()
        await page.getByRole('button',{name:/HSK 6/}).first().click()
        await clearOne('HSK 6')
      } else {
        await clearOne('Bài làm của bạn')
        await page.getByRole('button',{name:'Phóng to',exact:true}).click()
        await clearOne('Bài làm của bạn')
        await page.getByRole('button',{name:'Thu nhỏ',exact:true}).click()
        if(exam==='toeic') {
          await page.getByRole('textbox',{name:'Bài làm của bạn',exact:true}).fill('Keep part one')
          await page.getByRole('button',{name:'Chuyển sang Part 2 →',exact:true}).click()
          await clearOne('Bài làm của bạn')
          await page.getByRole('button',{name:'Quay lại Part 1',exact:true}).click()
          assert.equal(await page.getByRole('textbox',{name:'Bài làm của bạn',exact:true}).inputValue(),'Keep part one')
        }
      }
      await assertLayout()
      const language=page.getByLabel('Ngôn ngữ nhận xét',{exact:true}).filter({visible:true})
      await language.selectOption('English')
      assert.equal(await language.inputValue(),'English')
      await page.screenshot({path:`${output}/${exam}-${width}.png`,fullPage:true})
      assert.deepEqual(errors,[],`${exam}/${width}: browser errors`)
      await page.close()
      console.log(`PASS ${exam} at ${width}px`)
    }
  }
  console.log(`PASS ${checks} field clear interactions; 16 responsive layouts; task switching and language controls`)
  for(const touch of [false,true]) {
    const page=await browser.newPage({viewport:{width:touch?375:1280,height:touch?812:900},hasTouch:touch,isMobile:touch})
    activePage=page
    const errors=[]
    page.on('pageerror',error=>errors.push(error.message))
    await page.goto(`http://127.0.0.1:${server.address().port}/?exam=dock`)
    await page.evaluate(()=>{
      window.toolEvents=[]
      for(const type of ['pointerdown','pointerup','pointercancel','lostpointercapture','click']) document.addEventListener(type,event=>{
        if(event.target.closest?.('[data-floating-tool]')) window.toolEvents.push({type,id:event.pointerId,primary:event.isPrimary,detail:event.detail,tool:event.target.closest('[data-floating-tool]').dataset.floatingTool})
      },true)
    })
    const tool=id=>page.locator(`[data-floating-tool="${id}"]`)
    const trash=page.getByRole('status',{name:'Thùng rác xoá bong bóng',exact:true})
    const center=async id=>{const box=await tool(id).boundingBox();assert.ok(box);return {x:box.x+box.width/2,y:box.y+box.height/2}}
    const cdp=touch?await page.context().newCDPSession(page):null
    const down=async point=>{
      if(touch) await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...point,id:1}]})
      else {await page.mouse.move(point.x,point.y);await page.mouse.down()}
    }
    const move=async point=>{
      if(touch) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...point,id:1}]})
      else await page.mouse.move(point.x,point.y,{steps:8})
    }
    const up=async()=>{
      if(touch) await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
      else await page.mouse.up()
    }
    const tap=async id=>{if(touch)await tool(id).getByRole('button').tap();else await tool(id).getByRole('button').click()}
    const drag=async(id,destination)=>{
      await down(await center(id));await move(destination)
      await trash.waitFor()
      await up();await trash.waitFor({state:'hidden'})
    }
    await tool('calc').waitFor()
    assert.equal(await page.getByText('giữ để xoá',{exact:true}).count(),1)
    assert.equal(await trash.count(),0)
    await tap('calc');await page.getByRole('dialog',{name:'CalculatorBubble'}).waitFor()
    await tap('calc');await page.getByRole('dialog').waitFor({state:'hidden'})
    await drag('calc',{x:90,y:150})
    const moved=await center('calc')
    assert.ok(Math.abs(moved.x-90)<=2 && Math.abs(moved.y-150)<=2)
    assert.equal(await page.getByRole('dialog').count(),0,'drag must not open the tool')
    await tap('calc');await page.getByRole('dialog').waitFor()
    await tap('calc');await page.getByRole('dialog').waitFor({state:'hidden'})
    await down(await center('translate'));await trash.waitFor()
    const target=await trash.boundingBox()
    assert.ok(Math.abs(target.x+target.width/2-(touch?375:1280)/2)<=1)
    assert.ok(Math.abs(target.y+target.height/2-(touch?812:900)/2)<=1)
    await up();await trash.waitFor({state:'hidden'})
    assert.equal(await page.getByRole('dialog').count(),0,'hold must not open or remove a tool')
    assert.equal(await tool('translate').count(),1)
    await tap('translate');await page.getByRole('dialog',{name:'TranslateBubble'}).waitFor()
    await tap('translate');await page.getByRole('dialog').waitFor({state:'hidden'})
    const screenCenter={x:(touch?375:1280)/2,y:(touch?812:900)/2}
    await drag('chat',screenCenter)
    assert.equal(await tool('chat').count(),0)
    assert.equal(await tool('calc').count(),1)
    assert.equal(await tool('translate').count(),1)
    const beforeCancel=await center('translate')
    await down(beforeCancel);await move({x:140,y:220});await trash.waitFor()
    if(touch) await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]})
    else {await page.keyboard.press('Escape');await up()}
    await trash.waitFor({state:'hidden'})
    const afterCancel=await center('translate')
    assert.deepEqual(afterCancel,beforeCancel,'cancel must restore the position')
    await drag('calc',{x:-100,y:-100})
    const constrained=await tool('calc').boundingBox()
    assert.ok(constrained.x>=8 && constrained.y>=20)
    await page.setViewportSize({width:320,height:568})
    await page.waitForTimeout(50)
    const resized=await tool('calc').boundingBox()
    assert.ok(resized.x+resized.width<=320 && resized.y+resized.height<=568)
    // Holding and then dragging also removes an already detached bubble.
    await down(await center('calc'));await trash.waitFor();await move({x:160,y:284});await up()
    await trash.waitFor({state:'hidden'})
    assert.equal(await tool('calc').count(),0)
    await tap('translate');await page.getByRole('dialog').waitFor()
    await drag('translate',{x:160,y:284})
    assert.equal(await page.locator('[data-floating-tool]').count(),0)
    assert.equal(await page.getByRole('dialog').count(),0,'removing an active tool closes its window')
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false)
    assert.deepEqual(errors,[])
    await page.screenshot({path:`${output}/dock-${touch?'touch':'mouse'}.png`})
    console.log(`PASS floating tools: ${touch?'touch':'mouse'} tap, drag, hold, trash, cancel, viewport bounds and active window dismissal`)
    await page.close()
  }
} catch(error) {
  if(activePage && !activePage.isClosed()) {
    console.log('Tool event diagnostics:',await activePage.evaluate(()=>window.toolEvents || []))
    await activePage.screenshot({path:`${output}/failure.png`,fullPage:true})
    await writeFile(`${output}/failure.html`,await activePage.content())
  }
  throw error
} finally {
  await browser.close()
  await new Promise(resolve=>server.close(resolve))
}
