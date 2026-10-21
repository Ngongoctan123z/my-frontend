// Build-only data preparation: no API keys, network, D1 writes or provider calls.
import {build} from 'esbuild'
import assert from 'node:assert/strict'
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises'
import {createHash} from 'node:crypto'
const bundle=await build({entryPoints:['src/data/writing-bank/catalog.ts'],bundle:true,platform:'node',format:'esm',write:false})
const {buildWritingBank}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'))
const bank=buildWritingBank()
assert.equal(bank.questions.length,300);assert.equal(bank.sets.length,150)
assert.equal(new Set(bank.questions.map(row=>row.id)).size,300)
for(const exam of ['TOPIK','HSK_5','HSK_6'])assert.equal(bank.sets.filter(set=>set.exam===exam).length,50)
for(const type of ['TOPIK_51','TOPIK_52','TOPIK_53','TOPIK_54','HSK_5','HSK_6']){const rows=bank.questions.filter(row=>row.type===type);assert.equal(rows.length,50);assert.equal(new Set(rows.map(row=>row.content)).size,50)}
for(const row of bank.questions){
 if(row.type==='HSK_5'){const value=JSON.parse(row.content);assert.equal(value.part1.length,8);assert.deepEqual(value.part1.map(q=>q.id),[91,92,93,94,95,96,97,98]);assert.equal(value.part2.keywords.length,5);assert.match(value.part3.imageUrl,/^https:\/\/images\.unsplash\.com\/photo-/)}
 if(row.type==='HSK_6'){const passage=row.content.split('\n\n').slice(2).join('\n\n'),length=passage.replace(/\s/g,'').length;assert.ok(length>=900&&length<=1200,`${row.id}: passage length ${length}`)}
}
const charts=JSON.parse(await readFile('src/data/writing-bank/topikCharts.json','utf8'));assert.equal(charts.length,50)
assert.equal(new Set(charts.map(row=>row.sha256)).size,50)
for(const chart of charts){assert.equal(createHash('sha256').update(await readFile('public'+chart.imageUrl)).digest('hex'),chart.sha256);assert.ok(chart.verifiedData&&chart.source.documentUrl&&chart.source.pdfPage)}
await mkdir('app/api/ai-grader',{recursive:true});await writeFile('app/api/ai-grader/writing-seed.generated.ts','// Build-generated private grading bank. Server imports only.\nimport type {WritingRow,WritingSetRecord} from \"@/src/lib/writingBank\"\nexport const writingSeed: {questions:WritingRow[];sets:WritingSetRecord[]} = '+JSON.stringify(bank)+'\n')
await rm('public/exam-data/writing-bank-v1.json',{force:true})
console.log('PASS Writing bank: 150 complete sets, 300 distinct prompts, 50 source-verified charts, 50 real photos and 50 full-length HSK 6 passages')

