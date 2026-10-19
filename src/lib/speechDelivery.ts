export type SpeakingDelivery = {
  recognitionAvailable: boolean
  segments: { text: string; atMs: number; final: boolean }[]
  pauses: { startMs: number; durationMs: number }[]
}
export const PAUSE_START_MS = 1500
export const pauseDotCount = (durationMs: number) => durationMs < PAUSE_START_MS ? 0 : 1 + Math.floor((durationMs - PAUSE_START_MS) / 1000)
export const pauseDots = (durationMs: number) => Array(Math.min(12,pauseDotCount(durationMs))).fill('.').join(' ')
export function deliveryText(delivery?: SpeakingDelivery) {
  if(!delivery)return ''
  const events=[...delivery.segments.map(s=>({at:s.atMs,text:s.text})),...delivery.pauses.map(p=>({at:p.startMs,text:pauseDots(p.durationMs)}))]
  return events.sort((a,b)=>a.at-b.at).map(e=>e.text.trim()).filter(Boolean).join(' ')
}

/** Adaptive energy/voice-band gate for timing, not a clinical speech detector.
 * Browser noiseSuppression handles recorded audio; this never removes samples.
 */
export class SpeakingVoiceGate {
  private floor=0.004
  private samples:number[]=[]
  private voiced=false
  private lastVoiceAt=0
  update(rms:number,voiceBandRatio:number,nowMs:number) {
    // Learn the floor from quiet/non-vocal frames, never from sustained speech.
    if(rms < Math.max(0.012,this.floor*2.2) || voiceBandRatio < 0.35){
      this.samples.push(rms);if(this.samples.length>120)this.samples.shift()
      if(this.samples.length>=12 && this.samples.length%12===0){const sorted=[...this.samples].sort((a,b)=>a-b);this.floor=Math.min(0.05,Math.max(0.002,sorted[Math.floor(sorted.length*0.15)]))}
    }
    const threshold=Math.max(this.voiced?0.008:0.012,this.floor*(this.voiced?1.5:2.2))
    const candidate=rms>threshold && voiceBandRatio>0.35
    if(candidate){this.lastVoiceAt=nowMs;this.voiced=true}
    else if(nowMs-this.lastVoiceAt>180)this.voiced=false
    return this.voiced
  }
}
