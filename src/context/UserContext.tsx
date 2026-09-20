import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

type UserContextValue = {
  favorites: number[]
  isFavorite: (examId: number) => boolean
  toggleFavorite: (examId: number) => boolean
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useLocalStorage<number[]>('khode.favorites', [])

  const toggleFavorite = useCallback(
    (examId: number) => {
      let nextState = false
      setFavorites((current) => {
        if (current.includes(examId)) {
          nextState = false
          return current.filter((id) => id !== examId)
        }
        nextState = true
        return [...current, examId]
      })
      return nextState
    },
    [setFavorites],
  )

  const value = useMemo(
    () => ({
      favorites,
      isFavorite: (examId: number) => favorites.includes(examId),
      toggleFavorite,
    }),
    [favorites, toggleFavorite],
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUser must be used within UserProvider')
  return context
}
