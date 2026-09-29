'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '../context/ThemeContext'
import { UserProvider } from '../context/UserContext'
import { NotificationProvider } from '../context/NotificationContext'
import { SessionProvider } from 'next-auth/react'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60_000,  // dữ liệu được coi là fresh trong 5 phút
        gcTime: 10 * 60_000,    // xóa cache khỏi bộ nhớ sau 10 phút khi không dùng
        retry: 0,               // không retry — tránh gọn thêm request trên mạng yếu
        refetchOnWindowFocus: false, // không refetch khi user switch tab
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SessionProvider>
          <UserProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </UserProvider>
        </SessionProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
