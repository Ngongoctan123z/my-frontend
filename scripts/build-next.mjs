import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'build', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, VNDOCS_STATIC_BUILD: '1' },
})
child.on('error', error => {
  console.error('Unable to start the Next.js build:', error.message)
  process.exit(1)
})
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  else process.exit(code ?? 1)
})
