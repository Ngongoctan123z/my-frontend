import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Component, lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { Layout } from './components/common/Layout'
import { NotificationProvider } from './context/NotificationContext'
import { ThemeProvider } from './context/ThemeContext'
import { UserProvider } from './context/UserContext'
import { Home } from './pages/Home'

const ExamDetail = lazy(() => import('./pages/ExamDetail').then((m) => ({ default: m.ExamDetail })))
const Admin      = lazy(() => import('./pages/Admin').then((m) => ({ default: m.Admin })))
const Favorites  = lazy(() => import('./pages/Favorites').then((m) => ({ default: m.Favorites })))
const NotFound   = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })))

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 0 } },
})

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <p style={{ color: '#6B7280', fontSize: '1rem' }}>Đang tải trang...</p>
    </div>
  )
}

function LegacyExamTypeRedirect() {
  const { examType } = useParams<{ examType: string }>()
  const mapped = examType === 'thpt' ? 'THPT' : 'VAO_10'
  return <Navigate to={`/?examType=${mapped}`} replace />
}

function LegacySubjectRedirect() {
  const { examType, subject } = useParams<{ examType: string; subject: string }>()
  const mapped = examType === 'thpt' ? 'THPT' : 'VAO_10'
  return <Navigate to={`/?examType=${mapped}${subject ? `&subject=${subject}` : ''}`} replace />
}

function LegacyProvinceRedirect() {
  const { examType, subject, province } = useParams<{ examType: string; subject: string; province: string }>()
  const mapped = examType === 'thpt' ? 'THPT' : 'VAO_10'
  return (
    <Navigate
      to={`/?examType=${mapped}${subject ? `&subject=${subject}` : ''}${province ? `&province=${province}` : ''}`}
      replace
    />
  )
}

/** Global error boundary — shows error stack on screen instead of blank page */
class AppErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    const { error } = this.state
    if (error) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'monospace', maxWidth: '800px', margin: '2rem auto' }}>
          <h1 style={{ color: '#DC2626', fontSize: '1.4rem', marginBottom: '1rem' }}>
            ⚠️ Lỗi render ứng dụng
          </h1>
          <p style={{ color: '#1F2937', marginBottom: '0.5rem' }}>
            <strong>{error.name}:</strong> {error.message}
          </p>
          <pre style={{
            background: '#F3F4F6', padding: '1rem', borderRadius: '8px',
            overflow: 'auto', fontSize: '0.72rem', color: '#374151', whiteSpace: 'pre-wrap',
          }}>
            {error.stack}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem', padding: '0.5rem 1.5rem',
              background: '#2563EB', color: 'white', border: 'none',
              borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem',
            }}
          >
            🔄 Tải lại trang
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <UserProvider>
            <NotificationProvider>
              <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route element={<Layout />}>
                      {/* Main Search & Exam Portal is the root page */}
                      <Route index element={<Home />} />
                      <Route path="search" element={<Home />} />

                      {/* Single Exam Details view */}
                      <Route path="exams/:id" element={<ExamDetail />} />
                      <Route path="exams/:examType/:subject/:province/:year" element={<ExamDetail />} />

                      {/* Admin & Favorites */}
                      <Route path="favorites" element={<Favorites />} />
                      <Route path="quan-tri-he-thong-123" element={<Admin />} />

                      {/* Seamless redirects from intermediate pages to the main search portal */}
                      <Route path="category" element={<Navigate to="/" replace />} />
                      <Route path="category/:examType" element={<LegacyExamTypeRedirect />} />
                      <Route path="exams/:examType/:subject" element={<LegacySubjectRedirect />} />
                      <Route path="exams/:examType/:subject/:province" element={<LegacyProvinceRedirect />} />
                      <Route path="vao-10" element={<Navigate to="/?examType=VAO_10" replace />} />
                      <Route path="thpt" element={<Navigate to="/?examType=THPT" replace />} />

                      <Route path="*" element={<NotFound />} />
                    </Route>
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </NotificationProvider>
          </UserProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  )
}
