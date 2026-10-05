import React, { useEffect, useState } from 'react'
import { Loader2, Save, CheckCircle, Activity, KeyRound, Play, XCircle, Trash2, Plus } from 'lucide-react'

export function ModelsTab() {
  const [activeModels, setActiveModels] = useState<string[]>([])
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  
  const [fetching, setFetching] = useState(false)
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [fetchError, setFetchError] = useState('')

  const [testingModel, setTestingModel] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, { success: boolean, msg?: string }>>({})

  const [testingKeys, setTestingKeys] = useState(false)
  const [keyTestResults, setKeyTestResults] = useState<{ key: string, success: boolean, msg: string }[]>([])

  const [totalRequests, setTotalRequests] = useState('0')
  const [usages, setUsages] = useState<Record<string, string>>({})
  const [newKey, setNewKey] = useState('')

  useEffect(() => {
    fetch('/api/admin?type=configs')
      .then(res => res.json())
      .then(data => {
        if (data.ACTIVE_GROQ_MODEL) {
          setActiveModels(data.ACTIVE_GROQ_MODEL.split(',').map((m:string) => m.trim()).filter(Boolean))
        }
        if (data.GROQ_API_KEY) setApiKey(data.GROQ_API_KEY)
        if (data.TOTAL_API_REQUESTS) setTotalRequests(data.TOTAL_API_REQUESTS)
        
        const usageData: Record<string, string> = {}
        for (const k in data) {
          if (k.startsWith('KEY_USAGE_')) {
            usageData[k.replace('KEY_USAGE_', '')] = data[k]
          }
        }
        setUsages(usageData)
        
        setLoading(false)
      })
  }, [])

  const saveConfig = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_configs',
          payload: { ACTIVE_GROQ_MODEL: activeModels.join(','), GROQ_API_KEY: apiKey }
        })
      })
      if (!res.ok) {
        throw new Error("Lỗi khi lưu cấu hình")
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      alert("Lỗi: " + e.message)
    } finally {
      setSaving(false)
    }
  }

  const fetchModelsList = async () => {
    setFetching(true)
    setFetchError('')
    
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_groq_models' })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAvailableModels(data.models || [])
    } catch (e: any) {
      setFetchError(e.message)
    } finally {
      setFetching(false)
    }
  }

  const testSingleModel = async (model: string) => {
    setTestingModel(model)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_single_model', payload: { model } })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setTestResults(prev => ({ ...prev, [model]: { success: true } }))
    } catch (e: any) {
      setTestResults(prev => ({ ...prev, [model]: { success: false, msg: e.message } }))
    } finally {
      setTestingModel(null)
    }
  }

  const testApiKeys = async () => {
    if (!apiKey) return
    setTestingKeys(true)
    setKeyTestResults([])
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_api_keys', payload: { apiKeysString: apiKey } })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setKeyTestResults(data.results || [])
    } catch (e: any) {
      alert("Lỗi khi test API Keys: " + e.message)
    } finally {
      setTestingKeys(false)
    }
  }

  const toggleModel = (model: string) => {
    setActiveModels(prev => 
      prev.includes(model) ? prev.filter(m => m !== model) : [...prev, model]
    )
  }

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" /></div>

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Cấu Hình Groq AI</h2>
        <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-lg flex items-center gap-2">
          <Activity className="text-indigo-500 w-5 h-5" />
          <span className="text-sm text-indigo-900 font-medium">Tổng lượt gọi API AI:</span>
          <span className="font-bold text-lg text-indigo-700">{totalRequests}</span>
        </div>
      </div>
      
      <div className="space-y-6 mb-6 max-w-2xl">
        <div>
          <label className="flex items-center justify-between font-medium text-slate-700 mb-4">
            <span className="flex items-center gap-2"><KeyRound size={18} /> Quản lý API Keys (Groq)</span>
            <button
              onClick={testApiKeys}
              disabled={testingKeys || !apiKey}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {testingKeys ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Kiểm tra lỗi các Key
            </button>
          </label>
          
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm mb-4">
            <div className="p-3 bg-gray-50 border-b border-gray-200 flex gap-2">
              <input 
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="Nhập gsk_... mới vào đây"
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
              <button
                onClick={() => {
                  if (!newKey.trim()) return
                  const addedKeys = newKey.split(/[\n,]+/).map(k => k.trim()).filter(Boolean)
                  const currentKeys = apiKey.split(',').map(k => k.trim()).filter(Boolean)
                  const newKeysToAdd = addedKeys.filter(k => !currentKeys.includes(k))
                  
                  if (newKeysToAdd.length > 0) {
                     setApiKey([...currentKeys, ...newKeysToAdd].join(','))
                  }
                  setNewKey('')
                }}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded flex items-center gap-1 transition-colors"
              >
                <Plus size={16} /> Thêm Key
              </button>
            </div>
            <ul className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
              {apiKey.split(',').map(k => k.trim()).filter(Boolean).map((keyStr, idx) => (
                <li key={idx} className="p-3 flex items-center justify-between hover:bg-gray-50 group transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-mono text-sm text-gray-800 font-medium">
                        {keyStr.substring(0, 10)}...{keyStr.substring(keyStr.length - 4)}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Activity size={12} className="text-blue-500" /> Đã gọi: <span className="font-bold text-gray-700">{usages[keyStr] || 0}</span> lần
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                       const currentKeys = apiKey.split(',').map(k => k.trim()).filter(Boolean)
                       setApiKey(currentKeys.filter(k => k !== keyStr).join(','))
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                    title="Xoá Key này"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
              {!apiKey && (
                 <li className="p-6 text-center text-sm text-gray-500">Chưa có API Key nào. Vui lòng thêm Key để sử dụng AI.</li>
              )}
            </ul>
          </div>
          
          {keyTestResults.length > 0 && (
            <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 text-xs font-bold text-gray-600 border-b border-gray-200">Kết quả Test API Keys:</div>
              <ul className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                {keyTestResults.map((res, i) => (
                  <li key={i} className="px-3 py-2 flex items-center justify-between bg-white">
                    <span className="font-mono text-xs text-gray-600 truncate max-w-[200px]" title={res.key}>
                      {res.key.substring(0, 10)}...{res.key.substring(res.key.length - 4)}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${res.success ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`} title={res.msg}>
                      {res.success ? <><CheckCircle size={12}/> OK</> : <><XCircle size={12}/> Lỗi: {res.msg}</>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-2">Danh sách Model luân phiên (Phân cách bằng dấu phẩy)</label>
          <input 
            type="text"
            value={activeModels.join(',')}
            onChange={(e) => setActiveModels(e.target.value.split(',').map(m => m.trim()).filter(Boolean))}
            placeholder="Ví dụ: llama-3.3-70b-versatile, mixtral-8x7b-32768"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
          />
          <p className="text-xs text-gray-500 mt-1">Hệ thống sẽ thử lần lượt các model từ trái sang phải nếu bị lỗi.</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={saveConfig}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
        >
          {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
          Lưu cấu hình
        </button>

        <button
          onClick={fetchModelsList}
          disabled={fetching}
          className="flex items-center gap-2 px-6 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 font-bold rounded-lg transition-colors"
        >
          {fetching ? <Loader2 className="animate-spin w-5 h-5" /> : <Activity className="w-5 h-5" />}
          Lấy danh sách Model từ Groq
        </button>
      </div>

      {saved && (
        <div className="mb-6 flex items-center gap-2 text-green-600 font-medium bg-green-50 px-4 py-2 rounded-lg border border-green-200 max-w-2xl">
          <CheckCircle className="w-5 h-5" /> Đã lưu cấu hình thành công!
        </div>
      )}

      {fetchError && (
        <div className="mb-6 p-4 text-red-600 bg-red-50 rounded-lg border border-red-200 max-w-2xl">
          <strong>Lỗi:</strong> {fetchError}
        </div>
      )}

      {availableModels.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg flex justify-between items-center">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Activity className="text-purple-500" size={18} /> Danh sách Model khả dụng
            </h3>
            <span className="text-sm text-gray-500">Tích chọn để đưa vào danh sách luân phiên</span>
          </div>
          <div className="divide-y divide-gray-100">
            {availableModels.map(m => {
              const isSelected = activeModels.includes(m)
              const testRes = testResults[m]
              const isTesting = testingModel === m

              return (
                <div key={m} className={`p-4 flex items-center justify-between transition-colors ${isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}>
                  <label className="flex items-center gap-3 cursor-pointer flex-1">
                    <input 
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleModel(m)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="font-mono text-sm font-medium">{m}</span>
                  </label>
                  
                  <div className="flex items-center gap-3">
                    {testRes && (
                      <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${testRes.success ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`} title={testRes.msg}>
                        {testRes.success ? <><CheckCircle size={14}/> Hoạt động</> : <><XCircle size={14}/> Lỗi: {testRes.msg}</>}
                      </span>
                    )}
                    <button 
                      onClick={() => testSingleModel(m)}
                      disabled={isTesting}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded transition-colors disabled:opacity-50"
                    >
                      {isTesting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} 
                      Test thật
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
