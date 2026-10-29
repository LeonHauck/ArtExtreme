import { useEffect, useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { CalendarCheck, Check, CloudOff, ExternalLink, Images, KeyRound, Loader2, Lock, LogOut, MailCheck, Settings, Tags } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { InstallAppButton } from '@/components/InstallAppButton'
import { AuthCard, PasswordInput } from '@/components/admin/AuthCard'
import { useStudio } from '@/store/studio'
import { sendPasswordReset, signIn, signOut, useAuth } from '@/store/auth'
import { useSync } from '@/lib/settingsSync'
import { isRemote } from '@/lib/supabase'
import { disablePush, syncPush } from '@/lib/push'
import { endAdminSession, isAdminSession, startAdminSession } from '@/lib/auth'

const TABS = [
  { to: '/admin', label: 'Agenda', icon: CalendarCheck, end: true },
  { to: '/admin/precos', label: 'Preços', icon: Tags, end: false },
  { to: '/admin/portfolio', label: 'Portfólio', icon: Images, end: false },
  { to: '/admin/config', label: 'Configurações', icon: Settings, end: false },
]

/* ─── Modo Supabase: e-mail e senha ─────────────────────────────────── */

function LoginForm() {
  const [mode, setMode] = useState<'login' | 'forgot' | 'sent'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submitLogin = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(await signIn(email, password))
    setBusy(false)
  }

  const submitForgot = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const err = await sendPasswordReset(email)
    setBusy(false)
    if (err) setError(err)
    else setMode('sent')
  }

  if (mode === 'sent') {
    return (
      <AuthCard icon={<MailCheck size={20} />} title="Confira seu e-mail" subtitle="Se esse e-mail tiver acesso ao painel, enviamos um link para criar uma nova senha.">
        <p className="text-center text-sm text-mute">
          Não chegou? Veja a caixa de spam ou{' '}
          <button className="text-violet-light hover:underline" onClick={() => setMode('forgot')}>
            envie de novo
          </button>
          .
        </p>
        <button className="btn btn-outline mt-5 w-full" onClick={() => setMode('login')}>
          Voltar para o login
        </button>
      </AuthCard>
    )
  }

  if (mode === 'forgot') {
    return (
      <AuthCard icon={<KeyRound size={20} />} title="Esqueci minha senha" subtitle="Informe seu e-mail e enviamos um link para criar uma senha nova.">
        <form onSubmit={submitForgot} className="space-y-4">
          <div>
            <label htmlFor="email" className="label">E-mail</label>
            <input id="email" type="email" className="input" autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-pink">{error}</p>}
          <button className="btn btn-primary w-full" disabled={busy || !email}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : 'Enviar link'}
          </button>
          <button type="button" className="w-full text-center text-sm text-mute hover:text-bone" onClick={() => { setError(null); setMode('login') }}>
            Lembrei a senha
          </button>
        </form>
      </AuthCard>
    )
  }

  return (
    <AuthCard icon={<Lock size={20} />} title="Área do artista" subtitle="Entre com seu e-mail e senha.">
      <form onSubmit={submitLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">E-mail</label>
          <input id="email" type="email" className="input" autoComplete="email" autoFocus value={email} onChange={(e) => { setEmail(e.target.value); setError(null) }} required />
        </div>
        <div>
          <label htmlFor="password" className="label">Senha</label>
          <PasswordInput id="password" autoComplete="current-password" value={password} onChange={(v) => { setPassword(v); setError(null) }} />
        </div>
        {error && <p className="text-sm text-pink" role="alert">{error}</p>}
        <button className="btn btn-primary w-full" disabled={busy || !email || !password}>
          {busy ? <Loader2 size={18} className="animate-spin" /> : 'Entrar'}
        </button>
        <button type="button" className="w-full text-center text-sm text-violet-light hover:underline" onClick={() => { setError(null); setMode('forgot') }}>
          Esqueci minha senha
        </button>
      </form>
    </AuthCard>
  )
}

function RemoteGate() {
  const ready = useAuth((s) => s.ready)
  const isAdmin = useAuth((s) => s.isAdmin)
  const navigate = useNavigate()

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-mute">
        <Loader2 className="animate-spin" />
      </div>
    )
  }
  if (!isAdmin) return <LoginForm />
  return (
    <AdminShell
      onLogout={async () => {
        // Quem saiu da conta não recebe mais avisos neste aparelho
        await disablePush().catch(() => {})
        await signOut()
        navigate('/admin')
      }}
    />
  )
}

/** Mostra se as alterações do painel já foram salvas no banco. */
function SyncBadge() {
  const status = useSync((s) => s.status)
  if (status === 'idle') return null
  const map = {
    saving: { icon: <Loader2 size={13} className="animate-spin" />, text: 'Salvando…', cls: 'text-mute' },
    saved: { icon: <Check size={13} />, text: 'Salvo', cls: 'text-emerald-400' },
    error: { icon: <CloudOff size={13} />, text: 'Erro ao salvar', cls: 'text-pink' },
  }[status]
  return (
    <span className={`hidden items-center gap-1 text-xs sm:inline-flex ${map.cls}`} role="status">
      {map.icon} {map.text}
    </span>
  )
}

/* ─── Modo local: PIN no aparelho ───────────────────────────────────── */

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
    <AuthCard icon={<Lock size={20} />} title="Área do artista" subtitle="Digite o PIN para acessar o painel.">
      <form onSubmit={submit}>
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
          className="input text-center font-display text-3xl tracking-[0.6em]"
          aria-label="PIN"
          aria-invalid={error}
        />
        {error && <p className="mt-2 text-center text-sm text-pink">PIN incorreto.</p>}
        <button className="btn btn-primary mt-6 w-full" disabled={!value}>
          Entrar
        </button>
      </form>
    </AuthCard>
  )
}

function LocalGate() {
  const [unlocked, setUnlocked] = useState(isAdminSession)
  const navigate = useNavigate()
  if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} />
  return (
    <AdminShell
      onLogout={() => {
        endAdminSession()
        setUnlocked(false)
        navigate('/admin')
      }}
    />
  )
}

/* ─── Estrutura do painel ───────────────────────────────────────────── */

function AdminShell({ onLogout }: { onLogout: () => void }) {
  // Mantém a inscrição de notificações deste aparelho em dia no banco
  useEffect(() => {
    if (isRemote) void syncPush().catch(() => {})
  }, [])

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
            {isRemote && <SyncBadge />}
            <InstallAppButton className="btn btn-ghost btn-sm text-violet-light" label="App" />
            <Link to="/" className="btn btn-ghost btn-sm" title="Ver site">
              <ExternalLink size={16} />
              <span className="hidden sm:inline">Ver site</span>
            </Link>
            <button onClick={onLogout} className="btn btn-ghost btn-sm" title="Sair">
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

export function AdminLayout() {
  return isRemote ? <RemoteGate /> : <LocalGate />
}
