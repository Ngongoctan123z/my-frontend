import { Footer } from './Footer'
import { Header } from './Header'

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-page text-ink flex min-h-svh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 md:px-10">
        {children}
      </main>
      <Footer />
    </div>
  )
}

