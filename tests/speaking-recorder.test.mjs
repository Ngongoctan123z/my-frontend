import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm'

// Execute the real hook, replacing browser devices and React's hook storage.
async function harness({ audioContext = 'pending', recognition = 'missing', fetchImpl } = {}) {
  const slots = [], effects = [], timers = new Map(), streams = [], engines = [], clips = [], active = [], recorders = []
  let nextTimer = 1
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
    constructor(stream, options) { this.state = 'inactive'; this.mimeType = options?.mimeType || 'audio/webm'; this.header = 'container-' + recorders.length; recorders.push(this) }
    start() { this.state = 'recording' }
    stop() { this.state = 'inactive'; this.ondataavailable?.({ data: new Blob([this.header, new Uint8Array(1500)]) }); queueMicrotask(() => this.onstop?.()) }
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
    setTimeout(fn, ms = 0) { const id = nextTimer++; timers.set(id, { fn, at: now + ms }); return id },
    clearTimeout(id) { timers.delete(id) },
    setInterval(fn, ms) { const id = nextTimer++; timers.set(id, { fn, at: now + ms, ms }); return id },
    clearInterval(id) { timers.delete(id) },
    fetch: fetchImpl || (() => { throw new Error('Unexpected fetch') }),
  })
  const delivery = new SourceTextModule(stripTypeScriptTypes(await readFile(new URL('../src/lib/speechDelivery.ts', import.meta.url), 'utf8')), { context })
  await delivery.link(() => {}); await delivery.evaluate()
  const live = new SourceTextModule(stripTypeScriptTypes(await readFile(new URL('../src/lib/liveSpeakingTranscription.ts', import.meta.url), 'utf8')), { context })
  await live.link(() => {}); await live.evaluate()
  const module = new SourceTextModule(stripTypeScriptTypes(await readFile(new URL('../src/hooks/useSpeakingRecorder.ts', import.meta.url), 'utf8')), { context })
  await module.link(name => name === '../lib/speechDelivery' ? delivery : name === '../lib/liveSpeakingTranscription' ? live : new SyntheticModule(Object.keys(react), function () { for (const [key, value] of Object.entries(react)) this.setExport(key, value) }, { context }))
  await module.evaluate()
  const render = (hook = 'useSpeakingRecorder', value, ...args) => {
    cursor = 0
    const result = module.namespace[hook](value || { maxDurationMs: 30000, onComplete: clip => clips.push(clip), onStarted() {}, onActiveChange: value => active.push(value) }, ...args)
    while (effects.length) effects.shift()()
    return result
  }
  const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve() }
  return { render, clips, active, streams, engines, recorders, timers, flush,
    tick(ms) { now += ms },
    async advance(ms) {
      const target = now + ms
      for (;;) {
        const next = [...timers].filter(([, timer]) => timer.at <= target).sort((a, b) => a[1].at - b[1].at)[0]
        if (!next) break
        const [id, timer] = next; now = timer.at
        if (timer.ms) timer.at += timer.ms; else timers.delete(id)
        timer.fn(); await flush()
      }
      now = target; await flush()
    },
    unmount() { for (const slot of slots) slot?.cleanup?.() },
  }
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
  assert.equal(h.render().recording, true); assert.equal(h.render().recognitionState, 'server')
  h.tick(2000); recorder.stop(); await Promise.resolve(); assert.equal(h.clips.length, 1)
  h.unmount()
})
test('missing browser recognition displays server words before stopping, using independent audio files', async () => {
  const calls = []
  const h = await harness({ fetchImpl: async (url, options) => {
    calls.push(options)
    return Response.json({ transcript: calls.length === 1 ? 'I enjoy reading, um, books.' : 'Books help me learn.' })
  } })
  const recorder = h.render(); await recorder.start()
  await h.advance(3100)
  assert.equal(h.render().recording, true)
  assert.match(h.render().liveText, /um, books/)
  assert.equal(h.clips.length, 0, 'Words arrive before a completed clip exists')
  await h.advance(3000)
  assert.match(h.render().liveText, /Books help me learn/)
  assert.equal(calls.length, 2)
  for (const call of calls) {
    assert.equal(call.body.get('action'), 'transcribe_live')
    assert.equal(call.body.get('transcript'), null, 'Only microphone audio is sent')
    assert.ok(call.body.get('audio').size >= 500)
  }
  assert.notEqual(await calls[0].body.get('audio').text(), await calls[1].body.get('audio').text(), 'Each independent recorder has its own container')
  recorder.stop(); await h.flush()
  assert.equal(h.clips.length, 1)
  assert.equal(h.clips[0].delivery.recognitionAvailable, true)
  assert.equal(h.timers.size, 0)
  h.unmount()
})
test('browser recognition failure switches to server text while full recording continues', async () => {
  const h = await harness({ recognition: 'available', fetchImpl: async () => Response.json({ transcript: 'I enjoy reading, um, books.' }) })
  const recorder = h.render(); await recorder.start()
  h.engines[0].onerror({ error: 'network' })
  assert.equal(h.render().recognitionState, 'server')
  assert.equal(h.engines[0].onresult, null, 'Late native events are disconnected')
  await h.advance(3100)
  assert.equal(h.render().recording, true)
  assert.match(h.render().liveText, /um, books/)
  recorder.stop(); await h.flush(); assert.equal(h.clips.length, 1)
  h.unmount()
})
test('browser recognition that starts but returns no words falls back automatically', async () => {
  const h = await harness({ recognition: 'available', fetchImpl: async () => Response.json({ transcript: 'My microphone is working.' }) })
  await h.render().start(); await h.advance(5000)
  assert.equal(h.render().recognitionState, 'server')
  assert.match(h.render().liveText, /microphone is working/)
  assert.equal(h.render().recording, true)
  h.render().cancel(); h.unmount()
})
test('native recognition still supplies immediate words without server uploads', async () => {
  const calls = []
  const h = await harness({ recognition: 'available', fetchImpl: async options => { calls.push(options); return Response.json({ transcript: 'server' }) } })
  await h.render().start()
  await h.advance(3000)
  h.engines[0].onresult({ resultIndex: 0, results: [Object.assign([{ transcript: 'I enjoy reading.' }], { isFinal: true })] })
  await h.advance(3000)
  assert.equal(h.render().liveText, 'I enjoy reading.')
  assert.equal(h.render().recognitionState, 'listening')
  assert.equal(calls.length, 0)
  h.render().cancel(); h.unmount()
})
for (const operation of ['stop', 'cancel', 'unmount']) {
  test(`late live transcription is aborted and ignored after ${operation}`, async () => {
    let resolve, signal
    const h = await harness({ fetchImpl: (url, options) => { signal = options.signal; return new Promise(done => { resolve = done }) } })
    await h.render().start(); await h.advance(3100)
    assert.equal(signal.aborted, false)
    if (operation === 'unmount') h.unmount(); else h.render()[operation]()
    assert.equal(signal.aborted, true)
    resolve(Response.json({ transcript: 'Stale account audio' })); await h.flush()
    assert.equal(h.render().liveText, '')
    assert.equal(h.timers.size, 0)
    assert.equal(h.streams[0].getTracks()[0].readyState, 'ended')
    h.unmount()
  })
}
test('silent chunks never fabricate words, and provider errors preserve the complete recording', async () => {
  let calls = 0
  const h = await harness({ fetchImpl: async () => ++calls === 1 ? Response.json({ error: 'Silence' }, { status: 422 }) : Response.json({ error: 'Dịch vụ nhận dạng tạm ngắt' }, { status: 503 }) })
  const recorder = h.render(); await recorder.start(); await h.advance(3100)
  assert.equal(h.render().liveText, '')
  assert.equal(h.render().liveError, '')
  await h.advance(3000)
  assert.equal(h.render().recording, true)
  assert.match(h.render().liveError, /tạm ngắt/)
  assert.equal(h.render().error, '', 'A transcription failure must not be treated as a microphone failure')
  recorder.stop(); await h.flush()
  assert.equal(h.clips.length, 1)
  assert.ok(h.clips[0].blob.size >= 500)
  h.unmount()
})
test('a transient server failure retries the same audio once and then resumes live words', async () => {
  const uploads = []
  const h = await harness({ fetchImpl: async (url, options) => {
    uploads.push(options.body.get('audio'))
    return uploads.length === 1 ? Response.json({ error: 'Temporary network failure' }, { status: 503 }) : Response.json({ transcript: 'The recovered first sentence.' })
  } })
  await h.render().start(); await h.advance(3100)
  assert.match(h.render().liveError, /Temporary network failure/)
  await h.advance(1100)
  assert.equal(uploads.length, 2)
  assert.equal(await uploads[0].text(), await uploads[1].text(), 'Retry preserves the failed words instead of skipping to the next chunk')
  assert.equal(h.render().liveText, 'The recovered first sentence.')
  assert.equal(h.render().liveError, '')
  h.render().cancel(); h.unmount()
})
test('rate limits stop live requests without interrupting the full recording', async () => {
  let calls = 0
  const h = await harness({ fetchImpl: async () => { calls++; return Response.json({ error: 'Bạn đã dùng hết lượt Speaking hôm nay.' }, { status: 429 }) } })
  await h.render().start(); await h.advance(12_000)
  assert.equal(calls, 1, 'No retry storm after a rate or account limit')
  assert.equal(h.render().recording, true)
  assert.match(h.render().liveError, /hết lượt/)
  h.render().stop(); await h.flush(); assert.equal(h.clips.length, 1)
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


test('new recordings are completed automatically while restored clips do not trigger server work', async () => {
  const calls = []
  const h = await harness({ fetchImpl: async (url, options) => { calls.push(options.body.get('action')); return Response.json({ transcript: 'The final sentence.' }) } })
  const restored = { id: 'old', createdAt: 1, blob: new Blob([new Uint8Array(1500)]) }
  h.render('useSpeakingTranscript', restored, true); await h.flush()
  assert.deepEqual(calls, [])
  h.tick(2000)
  const fresh = { ...restored, id: 'new', createdAt: 3000 }
  h.render('useSpeakingTranscript', fresh, true); await h.flush()
  assert.deepEqual(calls, ['transcribe_audio'])
  assert.equal(h.render('useSpeakingTranscript', fresh, true).transcript, 'The final sentence.')
  h.render('useSpeakingTranscript', fresh, true); await h.flush()
  assert.equal(calls.length, 1, 'Renders do not repeatedly transcribe a clip')
  h.unmount()
})
