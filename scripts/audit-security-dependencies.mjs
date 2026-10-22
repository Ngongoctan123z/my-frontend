import {execFileSync} from 'node:child_process'
import {mkdir,writeFile,readFile} from 'node:fs/promises'
await mkdir('test-results/security',{recursive:true})
let output
try { output=execFileSync('npm',['audit','--omit=dev','--json'],{encoding:'utf8',timeout:90000,maxBuffer:8*1024*1024}) }
catch(error) { output=error.stdout; if(!output)throw error }
let report
try { report=JSON.parse(output) } catch { throw new Error('Dependency audit did not return a valid report') }
if(report.error)throw new Error('Dependency advisory service failed: '+report.error.code)
await writeFile('test-results/security/npm-audit.json',JSON.stringify(report,null,2))
console.log('PRODUCTION_DEPENDENCY_AUDIT',JSON.stringify(report.metadata?.vulnerabilities||{}))
for(const [name,item] of Object.entries(report.vulnerabilities||{})) console.log('DEPENDENCY_FINDING',JSON.stringify({name,severity:item.severity,isDirect:item.isDirect,range:item.range,fixAvailable:item.fixAvailable,via:item.via}))
if((report.metadata?.vulnerabilities?.high||0)+(report.metadata?.vulnerabilities?.critical||0)>0){
 const before=JSON.parse(await readFile('package-lock.json','utf8'))
 execFileSync('npm',['update','--package-lock-only','--ignore-scripts','follow-redirects','sharp','source-map-js','dompurify'],{encoding:'utf8',timeout:90000,maxBuffer:8*1024*1024})
 const after=JSON.parse(await readFile('package-lock.json','utf8'))
 const changed=Object.fromEntries(Object.entries(after.packages).filter(([key,value])=>JSON.stringify(before.packages[key])!==JSON.stringify(value)))
 const removed=Object.keys(before.packages).filter(key=>!Object.hasOwn(after.packages,key))
 console.log('SUGGESTED_LOCK_PATCH',JSON.stringify({changed,removed}))
 process.exitCode=1
}
