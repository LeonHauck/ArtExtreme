import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

/**
 * Sessão do artista no painel (só existe no modo Supabase).
 * O login é por e-mail e senha; quem não estiver na tabela `admins` não entra.
 */
interface AuthState {
  /** Já verificamos se existe sessão salva? */
  ready: boolean
  session: Session | null
  isAdmin: boolean
  /** O usuário chegou pelo link de "esqueci minha senha". */
  recovery: boolean
}

export const useAuth = create<AuthState>(() => ({
  ready: !supabase,
  session: null,
  isAdmin: false,
  recovery: false,
}))

async function checkAdmin(userId: string): Promise<boolean> {
  if (!supabase) return false
  const { data, error } = await supabase.from('admins').select('user_id').eq('user_id', userId).maybeSingle()
  return !error && !!data
}

async function apply(session: Session | null) {
  const isAdmin = session ? await checkAdmin(session.user.id) : false
  useAuth.setState({ session, isAdmin, ready: true })
}

let started = false

/** Liga o acompanhamento da sessão. Chamado uma vez, ao abrir o app. */
export function initAuth() {
  if (!supabase || started) return
  started = true
  supabase.auth.getSession().then(({ data }) => apply(data.session))
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') useAuth.setState({ recovery: true })
    // Evita chamadas ao banco dentro do callback (recomendação do supabase-js)
    setTimeout(() => apply(session), 0)
  })
}

const AUTH_ERRORS: Record<string, string> = {
  invalid_credentials: 'E-mail ou senha incorretos.',
  email_not_confirmed: 'Este e-mail ainda não foi confirmado.',
  over_request_rate_limit: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
  over_email_send_rate_limit: 'Muitos e-mails enviados. Aguarde alguns minutos e tente de novo.',
  weak_password: 'Senha fraca. Use pelo menos 8 caracteres, misturando letras e números.',
  same_password: 'A nova senha precisa ser diferente da atual.',
}

const message = (e: { code?: string; message: string }) => AUTH_ERRORS[e.code ?? ''] ?? e.message

export async function signIn(email: string, password: string): Promise<string | null> {
  if (!supabase) return 'Login indisponível.'
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  if (error) return message(error)
  if (!(await checkAdmin(data.user.id))) {
    await supabase.auth.signOut()
    return 'Esta conta não tem acesso ao painel.'
  }
  return null
}

export async function signOut() {
  await supabase?.auth.signOut()
  useAuth.setState({ session: null, isAdmin: false, recovery: false })
}

/** Envia o e-mail com o link para criar uma nova senha. */
export async function sendPasswordReset(email: string): Promise<string | null> {
  if (!supabase) return 'Indisponível.'
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/admin/nova-senha`,
  })
  return error ? message(error) : null
}

export async function updatePassword(password: string): Promise<string | null> {
  if (!supabase) return 'Indisponível.'
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return message(error)
  useAuth.setState({ recovery: false })
  return null
}
