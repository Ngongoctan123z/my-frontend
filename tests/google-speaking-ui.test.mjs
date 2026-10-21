// Real MediaRecorder/Web Audio; Google service events are fixtures. This does
// not claim to exercise Google's remote ASR or a user's physical microphone.
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { chromium } from '@playwright/test'
import { createServer } from 'node:http'
import { readFile, readdir, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const output='test-results/speaking-ui';await mkdir(output,{recursive:true})
const css=(await Promise.all((await readdir('.next/static/css',{recursive:true})).filter(file=>file.endsWith('.css')).map(file=>readFile(path.join('.next/static/css',file),'utf8')))).join('\n')
const entry=`import React,{useState}from'react';import{createRoot}from'react-dom/client';import{SpeakingRecorder}from'./src/components/speaking/SpeakingRecorder';
window.contexts=[];window.streams=[];window.recorders=[];window.engines=[];window.requests=[];
const Context=window.AudioContext;window.AudioContext=class extends Context{constructor(...args){super(...args);window.contexts.push(this)}};
const getMicrophone=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=async options=>{const stream=await getMicrophone(options);window.streams.push(stream);return stream};
const Recorder=window.MediaRecorder;window.MediaRecorder=class extends Recorder{constructor(stream,options){super(stream,options);this.fixtureStream=stream;window.recorders.push(this)}};
window.webkitSpeechRecognition=class{constructor(){window.engines.push(this)}start(...args){this.startArguments=args;queueMicrotask(()=>this.onstart?.())}emit(text,final=false){this.onresult?.({resultIndex:0,results:[Object.assign([{transcript:text}],{isFinal:final})]})}stop(){setTimeout(()=>{this.emit('I enjoy reading books and learning new things.',true);this.onend?.()},100)}abort(){this.aborted=true}};
window.fetch=async(url,options)=>{const form=options.body;window.requests.push(form.get('action'));return Response.json({transcript:'Thank you.'})};
function App(){const[clip,setClip]=useState();return <SpeakingRecorder question={{id:'google-fixture',examType:'IELTS_SPEAKING',part:'PART_1',questionEn:'What do you enjoy?',prepTimeSec:0,speakTimeSec:60}} clip={clip} strict={false} autoStart={false} canRecord={true} busy={false} processing='' footer={null} onLogin={()=>{}} onComplete={value=>{window.clip=value;setClip(value)}} onClear={()=>setClip(undefined)} onActiveChange={()=>{}} onStartExam={()=>{}} onAutoError={()=>{}}/>};createRoot(document.getElementById('root')).render(<App/>);`
const bundle=await build({stdin:{contents:entry,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'aliases',setup(builder){builder.onResolve({filter:/^@\//},args=>{const base=path.resolve(args.path.slice(2));return{path:['.tsx','.ts','/index.ts'].map(ext=>base+ext).find(existsSync)||base}})}}]})
const server=createServer((req,res)=>{if(req.url==='/app.js'){res.setHeader('Content-Type','text/javascript');return res.end(bundle.outputFiles[0].text)}if(req.url==='/style.css'){res.setHeader('Content-Type','text/css');return res.end(css)}res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="vi"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><body><main id="root"></main><script src="/app.js"></script></body></html>')})
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
const browser=await chromium.launch({headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']})
try{for(const width of[320,1280]){
 const context=await browser.newContext({viewport:{width,height:900},permissions:['microphone']}),page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message))
 await page.goto('http://127.0.0.1:'+server.address().port)
 await page.getByRole('button',{name:'Bắt đầu thu âm',exact:true}).click();await page.getByRole('button',{name:'Dừng thu âm',exact:true}).waitFor()
 await page.getByText('Google · English',{exact:true}).waitFor()
 assert.equal(await page.evaluate(()=>window.engines[0].startArguments.length),0)
 assert.equal(await page.evaluate(()=>window.recorders.length),1,'Google recognition does not spawn concurrent server recorders')
 assert.equal(await page.evaluate(()=>window.recorders[0].fixtureStream===window.streams[0]),true,'Record original microphone stream')
 await page.evaluate(()=>window.engines[0].emit('I enjoy read',false));await page.locator('[data-live-speaking-text]').filter({hasText:'I enjoy read'}).waitFor()
 // Suspending the analysis branch must not silence the saved microphone audio.
 await page.evaluate(()=>Promise.all(window.contexts.map(context=>context.suspend())));await page.waitForTimeout(1500)
 await page.getByRole('button',{name:'Dừng thu âm',exact:true}).click();await page.getByText('Bản thu đã sẵn sàng',{exact:true}).waitFor()
 const text=page.locator('[data-live-speaking-text]'),googleText=await text.textContent();assert.match(googleText,/^I enjoy reading books and learning new things\.(?: \.)*$/);assert.equal(await page.evaluate(()=>window.clip.delivery.segments.map(segment=>segment.text).join(' ')),'I enjoy reading books and learning new things.')
 assert.equal(await page.evaluate(()=>window.clip.transcriptSource),'web-speech');assert.deepEqual(await page.evaluate(()=>window.requests),[],'No automatic server overwrite of Google text')
 const audio=await page.evaluate(async()=>{const context=new AudioContext();try{const decoded=await context.decodeAudioData(await window.clip.blob.arrayBuffer());const values=decoded.getChannelData(0);let peak=0;for(const value of values)peak=Math.max(peak,Math.abs(value));return{duration:decoded.duration,peak}}finally{await context.close()}})
 assert.ok(audio.duration>1,'Saved audio actually decodes');assert.ok(audio.peak>.0001,'Original microphone audio survives a suspended analysis context')
 await page.getByRole('button',{name:'Nhận dạng lại bằng máy chủ',exact:true}).click();await page.locator('[data-server-transcript-comparison]').filter({hasText:'Thank you.'}).waitFor();assert.equal(await text.textContent(),googleText,'Short server result cannot replace Google transcript or its measured pauses')
 assert.equal(await page.evaluate(()=>window.streams.every(stream=>stream.getTracks().every(track=>track.readyState==='ended'))),true)
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);assert.deepEqual(errors,[])
 await page.screenshot({path:output+'/google-speech-'+width+'.png',fullPage:true});await context.close()
}console.log('PASS Google microphone start, interim/final words, original audio under suspended Web Audio, no Thank-you overwrite, cleanup and mobile/desktop layout')}
finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
