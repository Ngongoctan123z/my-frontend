import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getDb } from '@/src/db'
import { users, prompts, systemConfigs } from '@/src/db/schema'
import { desc, eq } from 'drizzle-orm'

async function checkAdmin() {
  const session = await auth()
  if (!session?.user?.email) {
    throw new Error('Unauthorized')
  }
  
  const rootAdmins = ['ngongoctan282005@gmail.com']
  if (!rootAdmins.includes(session.user.email)) {
    throw new Error('Forbidden')
  }
}

export async function GET(req: NextRequest) {
  try {
    await checkAdmin()
    const db = await getDb()
    const type = req.nextUrl.searchParams.get('type')

    if (type === 'users') {
      const allUsers = await db.select().from(users).orderBy(users.name)
      return NextResponse.json(allUsers)
    }

    if (type === 'prompts') {
      const allPrompts = await db.select().from(prompts).orderBy(desc(prompts.createdAt))
      return NextResponse.json(allPrompts)
    }

    if (type === 'configs') {
      const allConfigs = await db.select().from(systemConfigs)
      const configMap = allConfigs.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as any)
      
      if (!configMap.TOTAL_API_REQUESTS) {
        configMap.TOTAL_API_REQUESTS = '0'
      }
      
      if (!configMap.GROQ_API_KEY && process.env.GROQ_API_KEY) {
        configMap.GROQ_API_KEY = process.env.GROQ_API_KEY
      }

      return NextResponse.json(configMap)
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await checkAdmin()
    const db = await getDb()
    const body = await req.json()
    const { action, payload } = body

    if (action === 'save_configs') {
      for (const [k, v] of Object.entries(payload)) {
        if (v !== undefined && typeof v === 'string') {
          if (v === '') {
            await db.delete(systemConfigs).where(eq(systemConfigs.key, k))
          } else {
            await db.insert(systemConfigs).values({
              key: k,
              value: v
            }).onConflictDoUpdate({
              target: systemConfigs.key,
              set: { value: v }
            })
          }
        }
      }
      return NextResponse.json({ success: true })
    }

    if (action === 'add_prompt') {
      const { type, content, imageUrl } = payload
      const newPrompt = await db.insert(prompts).values({
        type,
        content,
        imageUrl: imageUrl || null
      }).returning()
      return NextResponse.json(newPrompt[0])
    }

    if (action === 'delete_prompt') {
      await db.delete(prompts).where(eq(prompts.id, payload.id))
      return NextResponse.json({ success: true })
    }

    if (action === 'test_groq_models') {
      try {
        const config = await db.select().from(systemConfigs).where(eq(systemConfigs.key, 'GROQ_API_KEY'))
        const apiKey = (config.length > 0 && config[0].value) ? config[0].value.split(',')[0] : process.env.GROQ_API_KEY?.split(',')[0]
        
        if (!apiKey) {
          return NextResponse.json({ error: 'Chưa có API Key nào được cấu hình.' }, { status: 400 })
        }

        const response = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        })
        
        if (!response.ok) {
          throw new Error('Không thể kết nối với Groq API. Kiểm tra lại API Key.')
        }

        const data = await response.json()
        const activeModels = data.data.map((m: any) => m.id).filter((id: string) => !id.includes('whisper') && !id.includes('vision') && !id.includes('tool-use'))
        return NextResponse.json({ models: activeModels.sort() })
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
      }
    }

    if (action === 'test_single_model') {
      try {
        const config = await db.select().from(systemConfigs).where(eq(systemConfigs.key, 'GROQ_API_KEY'))
        const apiKey = (config.length > 0 && config[0].value) ? config[0].value.split(',')[0] : process.env.GROQ_API_KEY?.split(',')[0]
        
        if (!apiKey) throw new Error('Missing API Key')

        const { model } = payload
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: 'Hi' }],
            max_tokens: 1
          })
        })

        if (!response.ok) {
          const err = await response.json()
          throw new Error(err.error?.message || 'Lỗi không xác định')
        }

        return NextResponse.json({ success: true })
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 })
      }
    }

    if (action === 'test_api_keys') {
      try {
        const { apiKeysString } = payload
        if (!apiKeysString) return NextResponse.json({ results: [] })
        
        const keys = apiKeysString.split(',').map((k:string) => k.trim()).filter(Boolean)
        const results = await Promise.all(keys.map(async (key: string) => {
          try {
            const response = await fetch('https://api.groq.com/openai/v1/models', {
              headers: { 'Authorization': `Bearer ${key}` }
            })
            if (!response.ok) {
              const err = await response.json()
              return { key, success: false, msg: err.error?.message || 'Lỗi không xác định' }
            }
            return { key, success: true, msg: 'Hoạt động tốt' }
          } catch (e: any) {
            return { key, success: false, msg: e.message }
          }
        }))

        return NextResponse.json({ results })
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 })
      }
    }

    if (action === 'update_user_status') {
      await db.update(users).set({ status: payload.status }).where(eq(users.id, payload.id))
      return NextResponse.json({ success: true })
    }

    if (action === 'update_user_plan') {
      const { id, plan } = payload
      let planExpiresAt = null
      
      // If upgraded to plus or pro, set expiration to 30 days from now
      if (plan === 'plus' || plan === 'pro') {
        planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }

      await db.update(users).set({ 
        plan, 
        planExpiresAt 
      }).where(eq(users.id, id))
      return NextResponse.json({ success: true })
    }

    if (action === 'delete_user') {
      await db.delete(users).where(eq(users.id, payload.id))
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
