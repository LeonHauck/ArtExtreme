import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { CircleCheck, KeyRound, Loader2, TriangleAlert } from 'lucide-react'
import { AuthCard, PasswordInput } from '@/components/admin/AuthCard'
import { updatePassword, useAuth } from '@/store/auth'
import { isRemote } from '@/lib/supabase'

/** Requisitos mínimos de senha (mostrados ao vivo para o artista). */
const RULES = [
  { test: (p: string) => p.length >= 8, label: 'Pelo menos 8 caracteres' },
  { test: (p: string) => /[a-zA-Z]/.test(p) && /\d/.test(p), label: 'Letras e números' },
]

/**
 * Página aberta pelo link do e-mail de "esqueci minha senha".
 * O supabase-js lê o token do link e cria uma sessão temporária; aqui o
 * artista escolhe a senha nova.
 */
export default function ResetPassword() {
  const ready = useAuth((s) => s.ready)
  const session = useAuth((s) => s.session)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  // O token do link leva um instante para ser processado
  const [waited, setWaited] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 2500)
    return () => clearTimeout(t)
  }, [])

  if (!isRemote) {
    return (
      <AuthCard icon={<TriangleAlert size={20} />} title="Indisponível" subtitle="A redefinição de senha só funciona com o banco de dados configurado.">
        <Link to="/admin" className="btn btn-outline w-full">Ir para o painel</Link>
      </AuthCard>
    )
  }

  if (done) {
    return (
      <AuthCard icon={<CircleCheck size={20} />} title="Senha alterada" subtitle="Pronto! Use a senha nova sempre que entrar no painel.">
        <Link to="/admin" className="btn btn-primary w-full">Entrar no painel</Link>
      </AuthCard>
    )
  }

  if (!session) {
    if (!ready || !waited) {
      return (
        <div className="flex min-h-dvh items-center justify-center text-mute">
          <Loader2 className="animate-spin" />
        </div>
      )
    }
    return (
      <AuthCard icon={<TriangleAlert size={20} />} title="Link inválido ou expirado" subtitle="Por segurança, o link vale por pouco tempo e só pode ser usado uma vez.">
        <Link to="/admin" className="btn btn-primary w-full">Pedir um novo link</Link>
      </AuthCard>
    )
  }

  const valid = RULES.every((r) => r.test(password)) && password === confirm

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    setBusy(true)
    const err = await updatePassword(password)
    setBusy(false)
    if (err) setError(err)
    else setDone(true)
  }

  return (
    <AuthCard icon={<KeyRound size={20} />} title="Criar nova senha" subtitle={`Conta: ${session.user.email}`}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="new" className="label">Nova senha</label>
          <PasswordInput id="new" autoComplete="new-password" autoFocus value={password} onChange={(v) => { setPassword(v); setError(null) }} />
          <ul className="mt-2 space-y-1 text-xs">
            {RULES.map((r) => (
              <li key={r.label} className={r.test(password) ? 'text-emerald-400' : 'text-mute'}>
                {r.test(password) ? '✓' : '·'} {r.label}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <label htmlFor="confirm" className="label">Repita a senha</label>
          <PasswordInput id="confirm" autoComplete="new-password" value={confirm} onChange={(v) => { setConfirm(v); setError(null) }} />
          {confirm && confirm !== password && <p className="mt-1 text-xs text-pink">As senhas não são iguais.</p>}
        </div>
        {error && <p className="text-sm text-pink" role="alert">{error}</p>}
        <button className="btn btn-primary w-full" disabled={!valid || busy}>
          {busy ? <Loader2 size={18} className="animate-spin" /> : 'Salvar nova senha'}
        </button>
      </form>
    </AuthCard>
  )
}
