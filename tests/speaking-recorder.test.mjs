import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm'

// Execute the real hook, replacing browser devices and React's hook storage.
async function harness({ audioContext = 'pending', recognition = 'missing', fetchImpl } = {}) {
  const slots = [], effects = [], timers = [], streams = [], engines = [], clips = [], active = []
  let cursor = 0, now = 1000
  const react = {
    useRef(value) { const i = cursor++; return slots[i] ||= { current: value } },
    useState(value) { const i = cursor++; if (!(i in slots)) slots[i] = value; return [slots[i], next => { slots[i] = typeof next === 'function' ? next(slots[i]) : next }] },
    useCallback(fn, deps) { const i = cursor++; const previous = slots[i]; if (!previous || deps.some((value, n) => value !== previous.deps[n])) slots[i] = { deps, fn }; return slots[i].fn },
    useEffect(fn, deps) { const i = cursor++; const previous = slots[i]; if (!previous || deps.some((value, n) => value !== previous.deps[n])) { previous?.cleanup?.(); slots[i] = { deps, cleanup: undefined }; effects.push(() => { slots[i].cleanup = fn() }) } },
  }
  const track = { readyState: 'live', stop() { this.readyState = 'ended' } }
  class Recorder {
    static isTypeSupported() { return true }
    constructor(stream, options) { this.state = 'inactive'; this.mimeType = options?.mimeType || 'audio/webm' }
    start() { this.state = 'recording' }
    stop() { this.state = 'inactive'; this.ondataavailable?.({ data: new Blob([new Uint8Array(1500)]) }); queueMicrotask(() => this.onstop?.()) }
  }
  class Context {
    state = 'suspended'; sampleRate = 48000
    resume() { if (audioContext === 'reject') return Promise.reject(new Error('blocked')); return new Promise(() => {}) }
    close() { this.state = 'closed'; return Promise.resolve() }
    createAnalyser() { return { fftSize: 1024, frequencyBinCount: 512, getByteTimeDomainData(bytes) { bytes.fill(128) }, getByteFrequencyData(bytes) { bytes.fill(0) } } }
    createMediaStreamSource() { return { connect() {} } }
  }
  class Recognition {
    constructor() { if (recognition === 'throw') throw new Error('Service blocked'); engines.push(this) }
    start() { this.started = true }
    stop() {}
  }
  const context = createContext({
    URL, Blob, FormData, AbortController, crypto, Uint8Array, console,
    Date: class extends Date { static now() { return now } },
    navigator: { mediaDevices: { getUserMedia: async () => { const stream = { getTracks: () => [track] }; streams.push(stream); return stream } } },
    window: { AudioContext: audioContext === 'missing' ? undefined : Context, ...(recognition === 'missing' ? {} : { SpeechRecognition: Recognition }), addEventListener() {}, removeEventListener() {} },
    MediaRecorder: Recorder,
    requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    setTimeout(fn) { timers.push(fn); return timers.length }, clearTimeout() {}, setInterval() { return 1 }, clearInterval() {},
    fetch: fetchImpl || (() => { throw new Error('Unexpected fetch') }),
  })
  const delivery = new SourceTextModule(stripTypeScriptTypes(await readFile(new URL('../src/lib/speechDelivery.ts', import.meta.url), 'utf8')), { context })
  await delivery.link(() => {}); await delivery.evaluate()
  const module = new SourceTextModule(stripTypeScriptTypes(await readFile(new URL('../src/hooks/useSpeakingRecorder.ts', import.meta.url), 'utf8')), { context })
  await module.link(name => name === '../lib/speechDelivery' ? delivery : new SyntheticModule(Object.keys(react), function () { for (const [key, value] of Object.entries(react)) this.setExport(key, value) }, { context }))
  await module.evaluate()
  const render = (hook = 'useSpeakingRecorder', value) => {
    cursor = 0
    const result = module.namespace[hook](value || { maxDurationMs: 30000, onComplete: clip => clips.push(clip), onStarted() {}, onActiveChange: value => active.push(value) })
    while (effects.length) effects.shift()()
    return result
  }
  return { render, clips, active, streams, engines, timers, tick(ms) { now += ms }, unmount() { for (const slot of slots) slot?.cleanup?.() } }
}

for (const audioContext of ['pending', 'reject', 'missing']) {
  test(`recording completes when AudioContext is ${audioContext}`, async () => {
    const h = await harness({ audioContext })
    const recorder = h.render()
    await recorder.start()
    assert.equal(h.render().recording, true)
    h.tick(2000); recorder.stop(); await Promise.resolve()
    assert.equal(h.clips.length, 1); assert.ok(h.clips[0].blob.size >= 500)
    assert.equal(h.streams[0].getTracks()[0].readyState, 'ended')
    h.unmount()
  })
}
test('a broken speech recognition constructor does not destroy the audio recording', async () => {
  const h = await harness({ recognition: 'throw' })
  const recorder = h.render(); await recorder.start()
  assert.equal(h.render().recording, true); assert.equal(h.render().recognitionState, 'interrupted')
  h.tick(2000); recorder.stop(); await Promise.resolve(); assert.equal(h.clips.length, 1)
  h.unmount()
})
test('transient recognition network failure restarts and delivers real words', async () => {
  const h = await harness({ recognition: 'available' })
  const recorder = h.render(); await recorder.start()
  h.engines[0].onerror({ error: 'network' }); h.engines[0].onend()
  h.timers.at(-1)()
  assert.equal(h.engines.length, 2)
  h.engines[1].onresult({ resultIndex: 0, results: [Object.assign([{ transcript: 'I enjoy reading, um, books.' }], { isFinal: true })] })
  assert.match(h.render().liveText, /um, books/)
  h.tick(2000); recorder.stop(); await Promise.resolve()
  assert.equal(h.clips[0].delivery.recognitionAvailable, true)
  h.unmount()
})
test('preview uploads audio only on explicit request and exposes read-only server text', async () => {
  const calls = []
  const h = await harness({ fetchImpl: async (url, options) => { calls.push({ url, options }); return Response.json({ transcript: 'I enjoy reading.' }) } })
  const clip = { id: 'first', blob: new Blob([new Uint8Array(1000)], { type: 'audio/mp4' }) }
  h.render('useSpeakingTranscript', clip)
  assert.equal(calls.length, 0)
  await h.render('useSpeakingTranscript', clip).transcribe()
  assert.equal(calls[0].options.body.get('action'), 'transcribe_audio')
  assert.equal(calls[0].options.body.get('audio').name, 'recording.m4a')
  assert.equal(calls[0].options.body.get('transcript'), null)
  assert.equal(h.render('useSpeakingTranscript', clip).transcript, 'I enjoy reading.')
  h.unmount()
})
test('late preview cannot replace text for a new recording and failures permit retry', async () => {
  let resolve
  const h = await harness({ fetchImpl: () => new Promise(done => { resolve = done }) })
  const first = { id: 'first', blob: new Blob(['audio']) }, second = { ...first, id: 'second' }
  h.render('useSpeakingTranscript', first)
  const pending = h.render('useSpeakingTranscript', first).transcribe()
  h.render('useSpeakingTranscript', second)
  resolve(Response.json({ transcript: 'Old recording' })); await pending
  assert.equal(h.render('useSpeakingTranscript', second).transcript, '')
  const failed = h.render('useSpeakingTranscript', second).transcribe()
  resolve(Response.json({ error: 'Thử lại' }, { status: 503 })); await failed
  assert.equal(h.render('useSpeakingTranscript', second).transcriptError, 'Thử lại')
  assert.equal(h.render('useSpeakingTranscript', second).transcribing, false)
  h.unmount()
})
