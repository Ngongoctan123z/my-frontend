import { Footer } from './Footer'
import { Header } from './Header'

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-page text-ink flex min-h-svh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-3 sm:px-6 md:px-8">
        {children}
      </main>
      <Footer />
    </div>
  )
}

