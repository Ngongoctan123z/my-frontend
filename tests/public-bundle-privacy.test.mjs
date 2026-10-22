import test from 'node:test'
import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { TOEIC_PRIVATE_PICTURE_SETS } from '../src/data/toeicWritingPrivate.ts'

test('deployed assets and browser chunks do not contain the private seed or default reference captions', async () => {
  for (const file of ['public/exam-data/writing-bank-v1.json','.open-next/assets/exam-data/writing-bank-v1.json']) await assert.rejects(readFile(file), {code:'ENOENT'})
  const files=(await readdir('.next/static/chunks',{recursive:true})).filter(file=>file.endsWith('.js'))
  const captions=TOEIC_PRIVATE_PICTURE_SETS.flatMap(set=>set.questions.map(q=>q.description)).filter(Boolean)
  assert.ok(captions.length>=5)
  for(const file of files){const source=await readFile(path.join('.next/static/chunks',file),'utf8');for(const caption of captions)assert.ok(!source.includes(caption),file+' contains a private reference caption')}
})
