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
const hskPassages = ['甲：乡村图书馆', '乙：山区邮递员', '丙：城市园丁'].map(story => '阅读下面的材料，十分钟后材料将被收回。请根据记忆写一篇四百字左右的缩写，题目自拟，不要加入个人看法。请注意故事发生的时间和人物之间的关系。\n\n' + story + '\n' + story.repeat(25))
const entry = `
import React from 'react'; import { createRoot } from 'react-dom/client';
import { AiGraderClient } from './app/ai-grader/ielts/AiGraderClient';
import { ToeicGraderClient } from './app/ai-grader/toeic/ToeicGraderClient';
import { TopikGraderClient } from './app/ai-grader/topik/TopikGraderClient';
import { HskGraderClient } from './app/ai-grader/hsk/HskGraderClient';
import { SpeakingAdminTab } from './src/components/admin/SpeakingAdminTab';
import { ChatWidget } from './src/components/chat/ChatWidget';
import * as fixtures from './src/data/fallbackPrompts';
import {fallbackToeicExamSets} from './src/lib/toeicExamSets';
import {toeicPhotoPracticeSets} from './src/data/toeicPhotoBank';
import {toeicEmailBank} from './src/data/toeicEmails';
import {buildWritingBank} from './src/data/writing-bank/catalog';
const writing=buildWritingBank();
const publicPrompt=row=>row.type==='TOPIK_53'?{id:row.id,imageUrl:row.imageUrl,...JSON.parse(row.content),content:JSON.parse(row.content).text}:row;
const linkedToeic=fallbackToeicExamSets().map((set,index)=>({...set,id:'linked-'+index,picturePromptId:'pictures-'+index,part1:{...set.part1,id:'email6-'+index},email7:{...set.email7,id:'email7-'+index},part2:{...set.part2,id:'essay-'+index}}));
window.requests=[];window.topikScenario=new URL(location.href).searchParams.get('scenario')==='topik-linked';
window.toeicScenario=new URL(location.href).searchParams.get('scenario')==='toeic-full';
window.hskScenario=new URL(location.href).searchParams.get('scenario')==='hsk-stability';
window.hskPassages=${JSON.stringify(hskPassages)};
window.historyRecords=[];window.savedHistory=[];window.historyRequests=0;window.historyResolvers=[];window.gradeResolvers=[];window.promptResolvers=[];
window.deferHistory=window.hskScenario;
window.deferHskPrompt=new URL(location.href).searchParams.has('delay-prompt');
window.loadHistoryFixture=()=>{window.historyRequests++;return window.deferHistory?new Promise(resolve=>window.historyResolvers.push(resolve)):Promise.resolve([...window.historyRecords]);};
window.resolveHistory=()=>{window.deferHistory=false;window.historyResolvers.splice(0).forEach(resolve=>resolve([...window.historyRecords]));};
window.fetch=async (url,options={})=>{
  const body=options.body ? JSON.parse(options.body) : {};
  window.requests.push({url,body});
  if(String(url).startsWith('/api/admin')){
    const rows=JSON.parse(localStorage.getItem('fixture-speaking-bank')||'[]');
    if(!body.action)return Response.json(rows);
    if(window.failAdminSave)return Response.json({error:'Không lưu được D1 thử nghiệm.'},{status:503});
    const payload=body.payload;
    if(body.action==='add_speaking_prompt'){const saved={...payload,id:'server-id-'+(rows.length+1)};rows.push(saved);localStorage.setItem('fixture-speaking-bank',JSON.stringify(rows));return Response.json(saved);}
    const index=rows.findIndex(row=>row.id===payload.id);if(index<0)return Response.json({error:'Không tìm thấy đề.'},{status:404});
    if(body.action==='delete_speaking_prompt'){rows.splice(index,1);localStorage.setItem('fixture-speaking-bank',JSON.stringify(rows));return Response.json({success:true});}
    rows[index]={...rows[index],...payload};localStorage.setItem('fixture-speaking-bank',JSON.stringify(rows));return Response.json(rows[index]);
  }

  let result={count:0,limit:50,plan:'free'};
  if(body.action==='get_writing_catalog')return Response.json({sets:writing.sets.filter(s=>s.exam===body.exam)});
  if(body.action==='get_writing_set'){if(window.failWritingSet)return Response.json({error:'Không tải được bộ mới.'},{status:503});const set=writing.sets.find(s=>s.id===body.id);return Response.json({set:{...set,questions:Object.fromEntries(Object.entries(set.children).map(([key,id])=>[key,publicPrompt(writing.questions.find(q=>q.id===id))]))}});}
  if(window.hskScenario&&body.action==='generate_prompt_batch'&&body.type==='HSK_6'){
    if(window.deferHskPrompt)return new Promise(resolve=>window.promptResolvers.push(resolve));
    return Response.json({prompts:window.hskPassages.map(content=>({content}))});
  }
  if(window.topikScenario&&body.action==='grade_essay')return Response.json({overallBand:body.type==='TOPIK_54'?40:body.type==='TOPIK_53'?24:8,scoreScale:body.type==='TOPIK_54'?50:body.type==='TOPIK_53'?30:10,detailedFeedback:'Đã chấm đúng bộ.'});
  if(window.toeicScenario&&body.action==='grade_essay'){if(window.failToeicType===body.type){window.failToeicType=null;return Response.json({error:'Temporary grading failure'},{status:503});}return Response.json(body.type==='TOEIC_PICTURE'?{overallBand:15,scoreScale:15,pictureTasks:JSON.parse(body.essay).map(row=>({...row,score:3})),detailedFeedback:'Pictures checked.'}:{overallBand:body.type==='TOEIC_ESSAY'?5:4,scoreScale:body.type==='TOEIC_ESSAY'?5:4,detailedFeedback:'Email or essay checked.'});}
  if(window.hskScenario&&body.action==='grade_essay')return new Promise(resolve=>window.gradeResolvers.push(resolve));
  if(body.action==='get_paired_full_test') result={sets:body.exam==='TOEIC'?linkedToeic:fixtures[body.exam+'_PAIRED_SETS']};
  if(body.action==='generate_prompt_batch') result={prompts:body.type==='TOEIC_PICTURE'?toeicPhotoPracticeSets().slice(0,3).map(set=>({content:JSON.stringify(set)})):body.type==='TOEIC_EMAIL_6'||body.type==='TOEIC_EMAIL_7'?toeicEmailBank().filter(row=>row.type===body.type).slice(0,3):fixtures[body.type+'_FALLBACKS'] || []};
  if(body.action==='grade') return new Promise(()=>{});
  return new Response(JSON.stringify(result),{headers:{'content-type':'application/json'}});
};
const key=new URL(location.href).searchParams.get('exam');
createRoot(document.getElementById('root')).render(React.createElement({ielts:AiGraderClient,toeic:ToeicGraderClient,topik:TopikGraderClient,hsk:HskGraderClient,dock:ChatWidget,admin:SpeakingAdminTab}[key]));
`
const stubs = {
  'next-auth/react': `import {useEffect,useState} from 'react'; const initial={user:{email:'ui-test@example.invalid'}}; export function useSession(){const [session,setSession]=useState(initial);useEffect(()=>{const refresh=()=>setSession({...initial,user:{...initial.user}});window.addEventListener('fixture-session',refresh);return()=>window.removeEventListener('fixture-session',refresh)},[]);return {data:session,status:'authenticated'}} export const signIn=()=>{};`,
  'next/navigation': `export const usePathname=()=>location.pathname;`,
  'next/dynamic': `import React from 'react'; export default function dynamic(loader){const C=React.lazy(loader.then ? ()=>loader : ()=>loader().then(defaultExport=>({default:defaultExport}))); return props=>React.createElement(React.Suspense,{fallback:null},React.createElement(C,props));}`,
  '@/src/utils/indexedDB': `export const getEssayHistory=async()=>window.hskScenario?window.loadHistoryFixture():[]; export const saveEssayHistory=async item=>{if(window.hskScenario||window.toeicScenario||window.topikScenario){window.savedHistory.push(item);window.historyRecords.unshift({...item,id:crypto.randomUUID(),timestamp:Date.now()})}}; export const clearEssayHistory=async()=>{};`,
}
for (const name of ['GradingResultModal','ShareExamModal','StudentManagementModal']) {
  stubs['@/src/components/common/'+name] = `export const ${name}=()=>null;`
}
stubs['@/src/components/common/GradingResultModal']=`import React from 'react';export const GradingResultModal=({isOpen,isGrading,result,examType,onClose})=>(window.hskScenario||window.toeicScenario)&&isOpen?React.createElement('div',{role:'dialog','aria-label':'Kết quả HSK thử nghiệm'},React.createElement('p',null,isGrading?'Đang chấm '+examType:result?.detailedFeedback),React.createElement('button',{onClick:onClose,disabled:isGrading},'Đóng kết quả')):null;`;
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
        if(exam==='toeic'){for(let q=1;q<=5;q++)await clearOne('TOEIC câu '+q);await assertLayout();await page.screenshot({path:`${output}/toeic-pictures-${width}.png`,fullPage:true});await page.getByRole('button',{name:'Chuyển sang câu 6 →',exact:true}).click();}
        await clearOne('Bài làm của bạn')
        await page.getByRole('button',{name:'Phóng to',exact:true}).click()
        await clearOne('Bài làm của bạn')
        await page.getByRole('button',{name:'Thu nhỏ',exact:true}).click()
        if(exam==='toeic') {
          await page.getByRole('textbox',{name:'Bài làm của bạn',exact:true}).fill('Keep part one')
          await page.getByRole('button',{name:'Chuyển sang câu 7 →',exact:true}).click()
          await clearOne('TOEIC câu 7')
          await page.getByRole('textbox',{name:'TOEIC câu 7',exact:true}).fill('Keep question seven')
          await page.getByRole('button',{name:'Chuyển sang luận (Câu 8) →',exact:true}).click()
          await clearOne('Bài làm của bạn')
          await page.getByRole('button',{name:'Quay lại câu 7',exact:true}).click()
          assert.equal(await page.getByRole('textbox',{name:'TOEIC câu 7',exact:true}).inputValue(),'Keep question seven')
          await page.getByRole('button',{name:'Quay lại câu 6',exact:true}).click()
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

  {
    const page=await browser.newPage({viewport:{width:375,height:900}});activePage=page
    await page.goto(`http://127.0.0.1:${server.address().port}/?exam=topik&scenario=topik-linked`)
    const picker=page.getByLabel('Chọn bộ đề Writing',{exact:true});await picker.selectOption('topik-practice-50')
    await page.waitForFunction(()=>document.querySelector('select[aria-label="Chọn bộ đề Writing"]')?.value==='topik-practice-50'&&!document.querySelector('select[aria-label="Chọn bộ đề Writing"]').disabled)
    await page.getByRole('textbox',{name:'TOPIK ㉠',exact:true}).fill('원래 시험 답안입니다.')
    await page.getByRole('textbox',{name:'TOPIK ㉡',exact:true}).fill('안내해 주시기 바랍니다.')
    await page.getByRole('button',{name:/^Câu 51/}).click()
    await page.getByRole('textbox',{name:'TOPIK ㉠',exact:true}).fill('개별 연습 답안입니다.')
    await page.getByRole('button',{name:/^Thi trọn bộ/}).click()
    await page.waitForFunction(()=>document.querySelector('select[aria-label="Chọn bộ đề Writing"]')?.value==='topik-practice-50'&&!document.querySelector('select[aria-label="Chọn bộ đề Writing"]').disabled)
    assert.equal(await picker.inputValue(),'topik-practice-50');assert.equal(await page.getByRole('textbox',{name:'TOPIK ㉠',exact:true}).inputValue(),'원래 시험 답안입니다.')
    await page.evaluate(()=>window.failWritingSet=true);await picker.selectOption('topik-practice-49');await page.getByText('Không tải được bộ mới.',{exact:true}).waitFor()
    assert.equal(await picker.inputValue(),'topik-practice-50');assert.equal(await page.getByRole('textbox',{name:'TOPIK ㉠',exact:true}).inputValue(),'원래 시험 답안입니다.')
    await page.evaluate(()=>window.failWritingSet=false)
    await page.getByRole('button',{name:'Chuyển sang Câu 52 →',exact:true}).click()
    await page.getByRole('textbox',{name:'TOPIK ㉠',exact:true}).fill('충분히 생각해야 한다.');await page.getByRole('textbox',{name:'TOPIK ㉡',exact:true}).fill('꾸준히 실천하는 것이 중요하다.')
    await page.getByRole('button',{name:'Chuyển sang Câu 53 →',exact:true}).click();await page.getByRole('textbox',{name:'TOPIK 53',exact:true}).fill('자료를 보면 일의 가치 인식 비율이 증가하였다.'.repeat(10))
    await page.getByRole('button',{name:'Chuyển sang Câu 54 →',exact:true}).click();await page.getByRole('textbox',{name:'TOPIK 54',exact:true}).fill('사람들은 서로 협력하면서 사회의 문제를 해결해야 한다.'.repeat(25))
    await page.getByRole('button',{name:/Nộp bài/}).click();await page.waitForFunction(()=>window.savedHistory.length===1)
    const saved=await page.evaluate(()=>window.savedHistory[0]);assert.equal(saved.result.linkedSetId,'topik-practice-50');assert.equal(saved.result.overallBand,80)
    const requests=await page.evaluate(()=>window.requests.filter(r=>r.body.action==='grade_essay').map(r=>r.body));assert.equal(requests.length,4)
    for(const request of requests)assert.equal(request.prompt,saved.result.sourcePrompts[request.type].content)
    assert.equal(requests.find(r=>r.type==='TOPIK_53').chartExtra,saved.result.sourcePrompts.TOPIK_53.imageDescription)
    assert.equal(await page.getByRole('textbox',{name:'TOPIK 54',exact:true}).inputValue(),'사람들은 서로 협력하면서 사회의 문제를 해결해야 한다.'.repeat(25));assert.equal(await picker.inputValue(),'topik-practice-50')
    await page.screenshot({path:output+'/topik-linked-mobile.png',fullPage:true});await page.close()
    console.log('PASS TOPIK exact linked set, independent single/full drafts, failed-load retention, source snapshot grading and preserved completed draft')
  }

  {
    const page=await browser.newPage({viewport:{width:375,height:900}});activePage=page
    const errors=[];page.on('pageerror',error=>errors.push(error.message))
    await page.goto(`http://127.0.0.1:${server.address().port}/?exam=toeic&scenario=toeic-full`)
    for(let q=1;q<=5;q++)await page.getByRole('textbox',{name:'TOEIC câu '+q,exact:true}).fill('Original sentence '+q)
    await page.getByRole('button',{name:/^Theo ảnh/}).click()
    await page.getByRole('textbox',{name:'TOEIC câu 1',exact:true}).fill('Single-part draft')
    await page.waitForTimeout(100)
    await page.getByRole('button',{name:/^Trọn bộ/}).click()
    assert.equal(await page.getByRole('textbox',{name:'TOEIC câu 1',exact:true}).inputValue(),'Original sentence 1','Independent picture loading must not change the linked full test')
    await page.getByRole('button',{name:'Chuyển sang câu 6 →',exact:true}).click()
    await page.getByRole('textbox',{name:'Bài làm của bạn',exact:true}).fill('Original first email')
    await page.getByRole('button',{name:'Chuyển sang câu 7 →',exact:true}).click()
    await page.getByRole('textbox',{name:'TOEIC câu 7',exact:true}).fill('Original second email')
    await page.getByRole('button',{name:'Chuyển sang luận (Câu 8) →',exact:true}).click()
    await page.getByRole('textbox',{name:'Bài làm của bạn',exact:true}).fill('Original opinion essay')
    await page.getByLabel('Ngôn ngữ nhận xét',{exact:true}).selectOption('English')
    await page.evaluate(()=>window.failToeicType='TOEIC_ESSAY')
    await page.getByRole('button',{name:'Nộp bài & Chấm đủ 8 câu',exact:true}).click()
    await page.getByText(/Temporary grading failure/).waitFor()
    assert.equal(await page.getByRole('textbox',{name:'Bài làm của bạn',exact:true}).inputValue(),'Original opinion essay')
    await page.getByRole('button',{name:'Nộp bài & Chấm đủ 8 câu',exact:true}).click()
    await page.waitForFunction(()=>window.savedHistory.length===1)
    const state=await page.evaluate(()=>({calls:window.requests.filter(r=>r.body.action==='grade_essay').map(r=>r.body),history:window.savedHistory[0]}))
    assert.deepEqual(state.calls.map(c=>c.type),['TOEIC_PICTURE','TOEIC_EMAIL_6','TOEIC_EMAIL_7','TOEIC_ESSAY','TOEIC_ESSAY'])
    assert.deepEqual(JSON.parse(state.calls[0].essay).map(row=>row.answer),[1,2,3,4,5].map(i=>'Original sentence '+i))
    assert.equal(state.calls[1].essay,'Original first email');assert.equal(state.calls[2].essay,'Original second email');assert.notEqual(state.calls[1].prompt,state.calls[2].prompt)
    assert.ok(state.calls.every(c=>c.feedbackLang==='English'));assert.equal(state.history.result.overallBand,28);assert.equal(state.history.result.scoreScale,28)
    assert.equal(state.history.result.linkedSetId,'linked-0')
    assert.deepEqual(state.history.result.sections.map(s=>s.promptId),['pictures-0','email6-0','email7-0','essay-0'])
    await page.getByRole('button',{name:'Đóng kết quả',exact:true}).click()
    await page.getByRole('button',{name:'Quay lại câu 7',exact:true}).click()
    assert.equal(await page.getByRole('textbox',{name:'TOEIC câu 7',exact:true}).inputValue(),'Original second email')
    await page.getByRole('button',{name:'Quay lại câu 6',exact:true}).click()
    await page.getByRole('button',{name:'Quay lại câu 1–5',exact:true}).click()
    assert.equal(await page.getByRole('textbox',{name:'TOEIC câu 1',exact:true}).inputValue(),'Original sentence 1')
    assert.deepEqual(errors,[]);await page.close()
    console.log('PASS TOEIC all eight answers, distinct emails, feedback language, partial retry cache, raw marks and preserved draft')
  }

  {
    const page=await browser.newPage({viewport:{width:375,height:900}});activePage=page
    await page.goto(`http://127.0.0.1:${server.address().port}/?exam=toeic&scenario=toeic-full`)
    for(const number of [6,7]){
      await page.getByRole('button',{name:new RegExp('^Email '+(number-5))}).click()
      await page.getByText('From:',{exact:false}).waitFor()
      await page.getByRole('textbox',{name:'Bài làm của bạn',exact:true}).fill('Independent email '+number)
    }
    for(const number of [6,7]){
      await page.getByRole('button',{name:new RegExp('^Email '+(number-5))}).click()
      assert.equal(await page.getByRole('textbox',{name:'Bài làm của bạn',exact:true}).inputValue(),'Independent email '+number)
      const submit=page.getByRole('button').filter({hasText:'Nộp bài & Chấm'});await submit.click();await page.waitForFunction(n=>window.savedHistory.length===n,number-5)
      await page.getByRole('button',{name:'Đóng kết quả',exact:true}).click()
    }
    const calls=await page.evaluate(()=>window.requests.filter(r=>r.body.action==='grade_essay').map(r=>r.body))
    assert.deepEqual(calls.map(row=>row.type),['TOEIC_EMAIL_6','TOEIC_EMAIL_7']);assert.notEqual(calls[0].prompt,calls[1].prompt)
    assert.deepEqual(calls.map(row=>row.essay),['Independent email 6','Independent email 7']);await page.close()
    console.log('PASS separate question 6/7 practice tabs retain independent prompts and answers through submission')
  }

  {
    const page=await browser.newPage({viewport:{width:375,height:900}})
    activePage=page
    const errors=[];page.on('pageerror',error=>errors.push(error.message))
    await page.goto(`http://127.0.0.1:${server.address().port}/?exam=hsk&scenario=hsk-stability`)
    await page.getByRole('button',{name:/^HSK 6/}).click()
    const passage=page.getByRole('region',{name:'Bài đọc HSK 6',exact:true})
    const answer=page.getByRole('textbox',{name:'HSK 6',exact:true})
    const submit=page.getByRole('button',{name:'Nộp bài & Chấm HSK 6 (100đ)',exact:true})
    const summaryA='乡村图书馆的故事\n年轻教师回到家乡，整理图书室并邀请村民参加阅读活动。'
    await passage.waitFor();assert.equal(await passage.textContent(),hskPassages[0])
    await answer.fill(summaryA)
    await page.evaluate(()=>{
      window.historyRecords=[{id:'history-a',email:'ui-test@example.invalid',examType:'HSK_6',prompt:window.hskPassages[0],essay:'旧的缩写',timestamp:Date.now(),result:{overallBand:80}}]
      window.resolveHistory();window.dispatchEvent(new Event('fixture-session'))
    })
    await page.waitForTimeout(150)
    assert.equal(await passage.textContent(),hskPassages[0],'Delayed history must not replace the active passage')
    assert.equal(await answer.inputValue(),summaryA)
    assert.equal(await page.evaluate(()=>window.requests.filter(r=>r.body.action==='generate_prompt_batch'&&r.body.type==='HSK_6').length),1)
    assert.equal(await page.evaluate(()=>window.historyRequests),1,'Refreshing the session object must not reload/select a prompt')
    await page.getByRole('button',{name:'Ẩn bài đọc (Mô phỏng thi)',exact:true}).click()
    await page.getByLabel('Ngôn ngữ nhận xét',{exact:true}).selectOption('English')
    await page.evaluate(()=>window.deferHistory=true)
    await submit.click();await page.waitForFunction(()=>window.gradeResolvers.length===1)
    const sent=await page.evaluate(()=>window.requests.find(r=>r.body.action==='grade_essay').body)
    assert.equal(sent.prompt,hskPassages[0]);assert.equal(sent.essay,summaryA);assert.equal(sent.feedbackLang,'English')
    assert.equal(await page.getByRole('button',{name:'Đổi đề',exact:true}).isDisabled(),true)
    assert.equal(await page.getByRole('button',{name:/^HSK 5/}).isDisabled(),true)
    assert.equal(await answer.isDisabled(),true)
    await page.evaluate(()=>window.gradeResolvers.shift()(Response.json({overallBand:85,overallBandFormatted:'85/100',detailedFeedback:'Kết quả đúng bài A',criteria:{},corrections:[]})))
    await page.getByText('Kết quả đúng bài A',{exact:true}).waitFor()
    await page.getByRole('button',{name:'Đóng kết quả',exact:true}).click()
    assert.equal(await answer.inputValue(),summaryA,'Successful grading must preserve the summary')
    await page.getByRole('button',{name:'Hiện bài đọc',exact:true}).click()
    assert.equal(await passage.textContent(),hskPassages[0],'Successful grading must preserve its source')
    const saved=await page.evaluate(()=>window.savedHistory.at(-1))
    assert.equal(saved.prompt,sent.prompt);assert.equal(saved.essay,sent.essay)
    await page.evaluate(()=>window.resolveHistory())
    await page.waitForTimeout(50)
    assert.equal(await passage.textContent(),hskPassages[0],'Post-grade history refresh must not change the source or block the result')
    page.once('dialog',dialog=>dialog.dismiss())
    await page.getByRole('button',{name:'Đổi đề',exact:true}).click()
    assert.equal(await passage.textContent(),hskPassages[0]);assert.equal(await answer.inputValue(),summaryA)
    page.once('dialog',dialog=>dialog.accept())
    await page.getByRole('button',{name:'Đổi đề',exact:true}).click()
    await page.waitForFunction(source=>document.querySelector('[aria-label="Bài đọc HSK 6"]').textContent===source,hskPassages[1])
    assert.equal(await answer.inputValue(),'','An explicit new prompt must not inherit the previous summary')
    const summaryB='山区邮递员的故事\n邮递员每天走山路，把信件送给村里的居民。'
    await answer.fill(summaryB);await submit.click();await page.waitForFunction(()=>window.gradeResolvers.length===1)
    await page.evaluate(()=>window.gradeResolvers.shift()(Response.json({error:'Thử nghiệm mất kết nối'},{status:503})))
    await page.getByText('Thử nghiệm mất kết nối',{exact:true}).waitFor()
    assert.equal(await passage.textContent(),hskPassages[1]);assert.equal(await answer.inputValue(),summaryB)
    await submit.click();await page.waitForFunction(()=>window.gradeResolvers.length===1)
    const attempts=await page.evaluate(()=>window.requests.filter(r=>r.body.action==='grade_essay').map(r=>r.body))
    assert.deepEqual(attempts.slice(1).map(r=>({prompt:r.prompt,essay:r.essay})),[{prompt:hskPassages[1],essay:summaryB},{prompt:hskPassages[1],essay:summaryB}])
    await page.evaluate(()=>window.gradeResolvers.shift()(Response.json({overallBand:82,detailedFeedback:'Kết quả đúng bài B',criteria:{},corrections:[]})))
    await page.getByText('Kết quả đúng bài B',{exact:true}).waitFor();await page.getByRole('button',{name:'Đóng kết quả',exact:true}).click()
    assert.equal(await passage.textContent(),hskPassages[1]);assert.equal(await answer.inputValue(),summaryB)
    assert.deepEqual(errors,[]);await page.screenshot({path:`${output}/hsk6-stable-submission.png`,fullPage:true});await page.close()
    console.log('PASS HSK 6: delayed history, session refresh, hidden passage, exact submitted source, retained answer, explicit prompt change and failed-request retry')
  }
  {
    const page=await browser.newPage({viewport:{width:1280,height:900}})
    activePage=page
    await page.goto(`http://127.0.0.1:${server.address().port}/?exam=hsk&scenario=hsk-stability&delay-prompt=1`)
    await page.getByRole('button',{name:/^HSK 6/}).click();await page.waitForFunction(()=>window.promptResolvers.length===1)
    assert.equal(await page.getByRole('button',{name:'Nộp bài & Chấm HSK 6 (100đ)',exact:true}).isDisabled(),true,'Cannot grade before the source has loaded')
    await page.evaluate(()=>{window.historyRecords=[{id:'restored-b',email:'ui-test@example.invalid',examType:'HSK_6',prompt:window.hskPassages[1],essay:'保留历史中的缩写',timestamp:Date.now(),result:{detailedFeedback:'Bài B đã lưu',overallBand:80}}];window.resolveHistory()})
    await page.waitForFunction(()=>document.body.textContent.includes('Lịch sử (1)'))
    await page.getByRole('button',{name:'Lịch sử (1)',exact:true}).filter({visible:true}).click()
    await page.getByRole('button',{name:'Xem lại bài →',exact:true}).click()
    await page.getByText('Bài B đã lưu',{exact:true}).waitFor();await page.getByRole('button',{name:'Đóng kết quả',exact:true}).click()
    await page.evaluate(()=>window.promptResolvers.shift()(Response.json({prompts:window.hskPassages.map(content=>({content}))})))
    await page.waitForTimeout(150)
    assert.equal(await page.getByRole('region',{name:'Bài đọc HSK 6',exact:true}).textContent(),hskPassages[1],'Late prompt response must not overwrite restored history')
    assert.equal(await page.getByRole('textbox',{name:'HSK 6',exact:true}).inputValue(),'保留历史中的缩写')
    await page.getByRole('button',{name:/^HSK 5/}).click();await page.getByRole('button',{name:/^HSK 6/}).click()
    assert.equal(await page.getByRole('region',{name:'Bài đọc HSK 6',exact:true}).textContent(),hskPassages[1])
    assert.equal(await page.evaluate(()=>window.requests.filter(r=>r.body.action==='generate_prompt_batch'&&r.body.type==='HSK_6').length),1)
    await page.screenshot({path:`${output}/hsk6-restored-passage.png`,fullPage:true});await page.close()
    console.log('PASS HSK 6: delayed prompt cannot overwrite a restored passage or mismatch its saved summary')
  }
  for(const width of [375,1280]) {
    const page=await browser.newPage({viewport:{width,height:900}});activePage=page
    const errors=[];page.on('pageerror',error=>errors.push(error.message))
    await page.goto(`http://127.0.0.1:${server.address().port}/?exam=admin`)
    await page.getByRole('button',{name:'Thêm đề',exact:true}).click()
    await page.getByLabel('Chủ đề',{exact:true}).fill('Persistent speaking topic')
    await page.getByLabel('Câu hỏi / nội dung tiếng Anh',{exact:true}).fill('What do you enjoy doing?')
    await page.getByLabel('Câu hỏi tiếp theo (mỗi dòng một câu)',{exact:true}).fill('Why do you enjoy it?\nHow often do you do it?\nWho do you do it with?')
    await page.evaluate(()=>window.failAdminSave=true)
    await page.getByRole('button',{name:'Lưu đề Speaking',exact:true}).click()
    await page.getByRole('dialog').getByRole('alert').waitFor()
    assert.equal(await page.getByLabel('Chủ đề',{exact:true}).inputValue(),'Persistent speaking topic')
    await page.evaluate(()=>window.failAdminSave=false)
    await page.getByRole('button',{name:'Lưu đề Speaking',exact:true}).click()
    await page.getByRole('dialog').waitFor({state:'hidden'})
    await page.getByRole('button',{name:'Đã xuất bản',exact:true}).click()
    await page.getByRole('button',{name:'Đang ẩn',exact:true}).waitFor()
    await page.getByRole('button',{name:'Sửa',exact:true}).click()
    await page.getByLabel('Chủ đề',{exact:true}).fill('Updated speaking topic')
    await page.getByRole('button',{name:'Lưu đề Speaking',exact:true}).click()
    await page.getByRole('dialog').waitFor({state:'hidden'})
    const requests=await page.evaluate(()=>window.requests.filter(r=>r.body.action==='update_speaking_prompt').map(r=>r.body.payload))
    assert.equal(requests[0].id,'server-id-1');assert.equal(requests[0].isPublished,false);assert.equal(requests[0].subQuestions.length,3)
    await page.reload();await page.getByRole('heading',{name:'Updated speaking topic',exact:true}).waitFor()
    await page.getByRole('button',{name:'Đang ẩn',exact:true}).waitFor()
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false)
    await page.screenshot({path:`${output}/speaking-admin-${width}.png`,fullPage:true})
    assert.deepEqual(errors,[]);await page.close()
    console.log('PASS Speaking admin save failure, retained edits, server ID update, follow-ups, publish state and reload at '+width+'px')
  }
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
