import ts from 'typescript'
import { resolve, dirname } from 'node:path'

// The existing Next build skips type validation. Enforce it for the rewritten
// Speaking surface without hiding errors behind that repository-wide setting.
const configPath=resolve('tsconfig.json')
const configFile=ts.readConfigFile(configPath,ts.sys.readFile)
if(configFile.error)throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText,'\n'))
const config=ts.parseJsonConfigFileContent(configFile.config,ts.sys,dirname(configPath),undefined,configPath)
const program=ts.createProgram(config.fileNames,{...config.options,noEmit:true})
const paths=['app/speaking/','app/api/speaking/','src/components/speaking/','src/hooks/useSpeakingRecorder.ts','src/utils/speakingStorage.ts','src/lib/speaking.ts','src/data/speakingPrompts.ts','src/lib/aiKeyRotation.ts']
const errors=ts.getPreEmitDiagnostics(program).filter(d=>d.category===ts.DiagnosticCategory.Error&&d.file&&paths.some(p=>d.file.fileName.replaceAll('\\','/').includes('/'+p)||d.file.fileName.startsWith(p)))
if(errors.length){console.error(ts.formatDiagnosticsWithColorAndContext(errors,{getCurrentDirectory:ts.sys.getCurrentDirectory,getCanonicalFileName:f=>f,getNewLine:()=> '\n'}));process.exitCode=1}
else console.log('PASS Speaking TypeScript validation')
