import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

test('Vietnamese and English shared pages serialize only public exam props to their client boundary', async () => {
  const root = process.cwd(), directory = path.join(root, '.shared-privacy-test')
  await mkdir(directory, { recursive: true })
  const fixtures = {
    '@/src/db': 'export const getDb=async()=>({select:()=>({from:()=>({where:()=>({limit:async()=>[globalThis.__privateExam]})})})});',
    '@/src/db/schema': 'export const sharedExams={id:"id"};',
    'drizzle-orm': 'export const eq=()=>true;',
    'next/navigation': 'export const notFound=()=>{throw new Error("not found")};',
    SharedExamClient: 'import React from "react"; export function SharedExamClient({exam}){globalThis.__publicExam=exam;return React.createElement("main",null,exam.content)}',
  }
  try {
    const built = await build({ stdin: { contents: `import React from 'react';import {renderToString} from 'react-dom/server';import Vi from './app/shared/[id]/page';import En from './app/en/shared/[id]/page';export async function render(exam,en){globalThis.__privateExam=exam;const html=renderToString(await(en?En:Vi)({params:Promise.resolve({id:exam.id})}));return {html,props:globalThis.__publicExam}}`, loader:'tsx',resolveDir:root }, bundle:true,write:false,platform:'node',format:'esm',packages:'external',jsx:'automatic',plugins:[{name:'shared-page-fixtures',setup(b){
      b.onResolve({filter:/.*/},args=>{
        if(args.path.endsWith('/SharedExamClient')||args.path==='./SharedExamClient')return{path:'SharedExamClient',namespace:'fixture'}
        if(fixtures[args.path])return{path:args.path,namespace:'fixture'}
        if(args.path.startsWith('@/')){const base=path.join(root,args.path.slice(2));return{path:[base,base+'.ts',base+'.tsx'].find(existsSync)}}
      })
      b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:fixtures[args.path],loader:'js',resolveDir:root}))
    }}] })
    const file=path.join(directory,'render.mjs');await writeFile(file,built.outputFiles[0].text);const renderer=await import(pathToFileURL(file).href)
    const secret='INTERNAL_CHART_CONTEXT_SERVER_ONLY_9071'
    for(const en of [false,true])for(const content of [
      JSON.stringify({text:'Describe the graph.',context:secret,imageDescription:secret}),
      'Describe the graph.\n\nContext: '+secret,
      JSON.stringify({title:'HSK 5',part1:[{id:91,words:'他 / 学习',answer:secret}],part2:{id:99,keywords:['学习'],requirement:'Write 80 characters'},part3:{id:100,imageUrl:'/picture.webp',description:secret,requirement:'Write about the image'}}),
    ]){
      const exam={id:'shared-id',examType:'IELTS_TASK_1',content,imageUrl:'/chart.webp',imageDescription:secret,creatorId:'private-owner@example.invalid',requirePhone:true,expiresAt:new Date(Date.now()+86400000)}
      const result=await renderer.render(exam,en),serialized=JSON.stringify(result)
      assert.ok(!serialized.includes(secret));assert.ok(!serialized.includes(exam.creatorId))
      assert.equal(result.props.id,exam.id);assert.equal(result.props.requirePhone,true);assert.equal(result.props.imageUrl,exam.imageUrl)
    }
  }finally{await rm(directory,{recursive:true,force:true})}
})
