import { lazy, Suspense } from 'react'
import { BrowserRouter, Link, Route, Routes } from 'react-router'
import { SiteLayout } from '@/components/layout/SiteLayout'
import { AdminLayout } from '@/components/layout/AdminLayout'
import Home from '@/pages/Home'

// Páginas carregadas sob demanda: o 3D e o painel não pesam na página inicial
const Simulator = lazy(() => import('@/pages/Simulator'))
const Booking = lazy(() => import('@/pages/Booking'))
const Agenda = lazy(() => import('@/pages/admin/Agenda'))
const Pricing = lazy(() => import('@/pages/admin/Pricing'))
const Settings = lazy(() => import('@/pages/admin/Settings'))

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-bone/15 border-t-violet" />
    </div>
  )
}

function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="font-marker text-8xl text-violet">404</p>
      <p className="mt-4 font-display text-3xl tracking-wide">Página não encontrada</p>
      <Link to="/" className="btn btn-outline mt-8">
        Voltar ao início
      </Link>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route index element={<Home />} />
            <Route path="orcamento" element={<Simulator />} />
            <Route path="agendar" element={<Booking />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Agenda />} />
            <Route path="precos" element={<Pricing />} />
            <Route path="config" element={<Settings />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
