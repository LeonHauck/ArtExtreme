import { useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { CalendarCheck, ExternalLink, LogOut, Settings, Tags, Lock } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { InstallAppButton } from '@/components/InstallAppButton'
import { Ornament } from '@/components/ui/Ornament'
import { useStudio } from '@/store/studio'
import { endAdminSession, isAdminSession, startAdminSession } from '@/lib/auth'

const TABS = [
  { to: '/admin', label: 'Agenda', icon: CalendarCheck, end: true },
  { to: '/admin/precos', label: 'Preços', icon: Tags, end: false },
  { to: '/admin/config', label: 'Configurações', icon: Settings, end: false },
]

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const pin = useStudio((s) => s.adminPin)
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (value === pin) {
      startAdminSession()
      onUnlock()
    } else {
      setError(true)
      setValue('')
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <form onSubmit={submit} className="card w-full max-w-sm animate-fade-up p-8 text-center">
        <div className="flex justify-center">
          <Logo />
        </div>
        <Ornament className="my-6" />
        <Lock className="mx-auto mb-3 text-mute" size={22} />
        <h1 className="font-display text-2xl tracking-wider">Área do artista</h1>
        <p className="mt-1 text-sm text-mute">Digite o PIN para acessar o painel.</p>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          maxLength={8}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setError(false)
          }}
          className="input mt-6 text-center font-display text-3xl tracking-[0.6em]"
          aria-label="PIN"
          aria-invalid={error}
        />
        {error && <p className="mt-2 text-sm text-violet-light">PIN incorreto.</p>}
        <button className="btn btn-primary mt-6 w-full" disabled={!value}>
          Entrar
        </button>
        <Link to="/" className="mt-4 inline-block text-sm text-mute hover:text-bone">
          ← Voltar ao site
        </Link>
      </form>
    </div>
  )
}

export function AdminLayout() {
  const [unlocked, setUnlocked] = useState(isAdminSession)
  const navigate = useNavigate()

  if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} />

  const logout = () => {
    endAdminSession()
    setUnlocked(false)
    navigate('/admin')
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-bone/5 bg-ink/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/admin" className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="hidden rounded-sm border border-violet/50 px-2 py-0.5 font-display text-xs tracking-[0.25em] text-violet sm:inline">
              PAINEL
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <InstallAppButton className="btn btn-ghost btn-sm text-violet-light" label="App" />
            <Link to="/" className="btn btn-ghost btn-sm" title="Ver site">
              <ExternalLink size={16} />
              <span className="hidden sm:inline">Ver site</span>
            </Link>
            <button onClick={logout} className="btn btn-ghost btn-sm" title="Sair">
              <LogOut size={16} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
        <nav className="scrollbar-none mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6">
          {TABS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2 border-b-2 px-3 pt-1 pb-2.5 font-display text-base tracking-wider uppercase transition ${
                  isActive ? 'border-violet text-bone' : 'border-transparent text-mute hover:text-bone'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
