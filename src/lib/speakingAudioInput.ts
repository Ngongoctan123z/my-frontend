/** Keep quiet consonants: remove rumble/hiss, never mute samples with a gate.
 * Browser capture noise suppression is applied before this Web Audio graph.
 */
export function connectSpeakingAudioInput(context: AudioContext, microphone: MediaStream) {
  const source = context.createMediaStreamSource(microphone)
  const highPass = context.createBiquadFilter(), lowPass = context.createBiquadFilter()
  highPass.type = 'highpass'; highPass.frequency.value = 80; highPass.Q.value = Math.SQRT1_2
  lowPass.type = 'lowpass'; lowPass.frequency.value = Math.min(8000, context.sampleRate * 0.45); lowPass.Q.value = Math.SQRT1_2
  source.connect(highPass); highPass.connect(lowPass)
  const destination = context.createMediaStreamDestination()
  lowPass.connect(destination)
  return { stream: destination.stream, output: lowPass }
}
