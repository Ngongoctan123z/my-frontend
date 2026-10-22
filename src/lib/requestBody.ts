// Bound the decoded request body before parsing; Content-Length alone is untrusted.
export class RequestBodyError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}
export async function boundedJson(req: Request, limit = 32768): Promise<Record<string, unknown>> {
  if (!req.body) throw new RequestBodyError(400, 'Thiếu dữ liệu yêu cầu.')
  const reader = req.body.getReader(), chunks: Uint8Array[] = []
  let size = 0
  try {
    for (;;) {
      const {done,value} = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > limit) { await reader.cancel(); throw new RequestBodyError(413, 'Dữ liệu yêu cầu quá lớn.') }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  const body = new Uint8Array(size); let offset = 0
  for (const chunk of chunks) { body.set(chunk,offset); offset += chunk.length }
  let parsed: unknown
  try { parsed = JSON.parse(new TextDecoder().decode(body)) } catch { throw new RequestBodyError(400, 'Dữ liệu JSON không hợp lệ.') }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new RequestBodyError(400, 'Dữ liệu yêu cầu không hợp lệ.')
  return parsed as Record<string,unknown>
}
