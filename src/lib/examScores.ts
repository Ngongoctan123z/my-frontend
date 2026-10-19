/** Native task marks; scaled TOEIC scores require the ETS conversion table. */
export function toeicWritingRawScore(results: { overallBand: number; scoreScale: number }[]) {
  const raw = results.reduce((sum, result) => sum + Number(result.overallBand), 0)
  const max = results.reduce((sum, result) => sum + Number(result.scoreScale), 0)
  return { overallBand: raw, scoreScale: max, overallBandFormatted: `${raw}/${max}`, rawScore: { value: raw, max }, scoreLabel: 'Tổng điểm thô' }
}
