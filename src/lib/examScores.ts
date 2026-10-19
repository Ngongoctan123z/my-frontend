/** Native task marks; scaled TOEIC scores require the ETS conversion table. */
export function toeicWritingRawScore(results: { overallBand: number; scoreScale: number }[]) {
  if(results.length!==4||results.map(row=>row.scoreScale).sort((a,b)=>a-b).join(',')!=='4,4,5,15')throw new Error('Thiếu điểm của một trong bốn phần TOEIC Writing.')
  if(results.some(row=>!Number.isInteger(row.overallBand)||row.overallBand<0||row.overallBand>row.scoreScale))throw new Error('Điểm thành phần TOEIC Writing không hợp lệ.')
  const raw = results.reduce((sum, result) => sum + result.overallBand, 0)
  return { overallBand: raw, scoreScale: 28, overallBandFormatted: `${raw}/28`, rawScore: { value: raw, max: 28 }, scoreLabel: 'Tổng điểm thô' }
}
