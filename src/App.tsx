import { lazy, Suspense, useEffect, useRef } from 'react'
import { BrowserRouter, Link, Route, Routes, useNavigate } from 'react-router'
import { initAuth, useAuth } from '@/store/auth'
import { isRemote } from '@/lib/supabase'
import { isStandalone } from '@/lib/push'
import { loadRemoteSettings, startSettingsAutosave } from '@/lib/settingsSync'
import { SiteLayout } from '@/components/layout/SiteLayout'
import { AdminLayout } from '@/components/layout/AdminLayout'
import Home from '@/pages/Home'

// Páginas carregadas sob demanda: o 3D e o painel não pesam na página inicial
const Simulator = lazy(() => import('@/pages/Simulator'))
const Booking = lazy(() => import('@/pages/Booking'))
const Agenda = lazy(() => import('@/pages/admin/Agenda'))
const Pricing = lazy(() => import('@/pages/admin/Pricing'))
const Settings = lazy(() => import('@/pages/admin/Settings'))
const ResetPassword = lazy(() => import('@/pages/admin/ResetPassword'))
const PortfolioAdmin = lazy(() => import('@/pages/admin/Portfolio'))
const Reports = lazy(() => import('@/pages/admin/Reports'))

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

/**
 * App instalado aberto pelo ícone: se o artista já está logado, vai direto
 * para o painel. Clientes (e o site no navegador) continuam na página inicial.
 */
function OpenPanelOnLaunch() {
  const navigate = useNavigate()
  const ready = useAuth((s) => s.ready)
  const isAdmin = useAuth((s) => s.isAdmin)
  const pending = useRef(isRemote && isStandalone() && window.location.pathname === '/')

  useEffect(() => {
    if (!pending.current || !ready) return
    pending.current = false
    // Só se a pessoa ainda estiver na página inicial (não navegou enquanto carregava)
    if (isAdmin && window.location.pathname === '/') navigate('/admin', { replace: true })
  }, [ready, isAdmin, navigate])

  return null
}

export default function App() {
  // Sessão do artista + preços/configurações do banco (no modo Supabase)
  useEffect(() => {
    initAuth()
    void loadRemoteSettings()
    return startSettingsAutosave()
  }, [])

  return (
    <BrowserRouter>
      <OpenPanelOnLaunch />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route index element={<Home />} />
            <Route path="orcamento" element={<Simulator />} />
            <Route path="agendar" element={<Booking />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          {/* Fora do layout do painel: quem chega pelo link do e-mail ainda não está logado */}
          <Route path="admin/nova-senha" element={<ResetPassword />} />
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Agenda />} />
            <Route path="precos" element={<Pricing />} />
            <Route path="portfolio" element={<PortfolioAdmin />} />
            <Route path="relatorios" element={<Reports />} />
            <Route path="config" element={<Settings />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
