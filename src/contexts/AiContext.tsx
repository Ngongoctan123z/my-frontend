'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

const API_KEY_STORAGE = 'vndocs_gemini_key'

interface AiContextType {
  apiKey: string
  setApiKey: (key: string) => void
}

const AiContext = createContext<AiContextType>({
  apiKey: '',
  setApiKey: () => {},
})

export function AiProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKeyState] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem(API_KEY_STORAGE)
    if (saved) setApiKeyState(saved)
  }, [])

  const setApiKey = (key: string) => {
    setApiKeyState(key)
    if (key.trim()) {
      localStorage.setItem(API_KEY_STORAGE, key.trim())
    } else {
      localStorage.removeItem(API_KEY_STORAGE)
    }
  }

  return (
    <AiContext.Provider value={{ apiKey, setApiKey }}>
      {children}
    </AiContext.Provider>
  )
}

export const useAiKey = () => useContext(AiContext)
