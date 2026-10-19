import { copyFile, mkdir } from 'node:fs/promises'
await mkdir('public/exam-media', { recursive: true })
await copyFile('node_modules/pdfjs-dist/build/pdf.worker.min.mjs', 'public/exam-media/pdf.worker.min.mjs')
console.log('PDF viewer worker prepared on the website origin')
