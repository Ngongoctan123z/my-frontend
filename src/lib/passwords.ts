const encoder = new TextEncoder()
const prefix = 'pbkdf2-sha256'
// Cloudflare Web Crypto supports up to 100,000 PBKDF2 iterations per operation.
const iterations = 100000
const hex = (bytes: Uint8Array) => Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')
const unhex = (value: string) => Uint8Array.from(value.match(/../g) || [],b=>parseInt(b,16))
async function derive(password: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits'])
  return new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:salt as BufferSource,iterations,hash:'SHA-256'},key,256))
}
async function equalText(a: string,b: string) {
  const [left,right] = await Promise.all([a,b].map(value=>crypto.subtle.digest('SHA-256',encoder.encode(value))))
  const x=new Uint8Array(left),y=new Uint8Array(right);let difference=0
  for(let i=0;i<x.length;i++) difference |= x[i]^y[i]
  return difference===0
}
export async function hashPassword(password: string) {
  const salt=crypto.getRandomValues(new Uint8Array(16))
  return `${prefix}$${iterations}$${hex(salt)}$${hex(await derive(password,salt))}`
}
export async function verifyPassword(stored: unknown,password: unknown) {
  if(typeof stored!=='string'||typeof password!=='string'||!stored||password.length>1024) return false
  if(stored.startsWith(prefix+'$')) {
    const [algorithm,rounds,salt,digest,...extra]=stored.split('$')
    if(extra.length||algorithm!==prefix||rounds!==String(iterations)||!/^[a-f0-9]{32}$/.test(salt)||!/^[a-f0-9]{64}$/.test(digest)) return false
    return equalText(hex(await derive(password,unhex(salt))),digest)
  }
  // Legacy accounts are upgraded atomically by the caller after a successful login.
  return equalText(stored,password)
}
export const isPasswordHash = (value: string) => value.startsWith(prefix+'$')
