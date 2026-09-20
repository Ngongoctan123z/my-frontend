import { Outlet } from 'react-router-dom'
import { Footer } from './Footer'
import { Header } from './Header'

export function Layout() {
  return (
    <div className="bg-page text-ink flex min-h-svh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-12 md:px-10 md:py-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
