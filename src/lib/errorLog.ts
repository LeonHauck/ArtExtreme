import { supabase } from './supabase'

/**
 * Registro de erros do app (tabela `app_errors` no Supabase), para descobrir o
 * que aconteceu quando alguém diz que "travou". Não grava dados pessoais: só a
 * mensagem do erro, a página, o tipo de aparelho e se é o app instalado.
 * Falhas aqui nunca atrapalham o app.
 */

const MAX_PER_SESSION = 8
const sent = new Set<string>()

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true

export function describeError(err: unknown): { message: string; detail: string | null } {
  if (err instanceof Error) return { message: `${err.name}: ${err.message}`, detail: err.stack ?? null }
  if (typeof err === 'string') return { message: err, detail: null }
  try {
    return { message: JSON.stringify(err), detail: null }
  } catch {
    return { message: String(err), detail: null }
  }
}

export function reportError(kind: string, err: unknown, extra?: string) {
  try {
    if (!supabase) return
    const { message, detail } = describeError(err)
    const key = `${kind}|${message}`
    if (sent.has(key) || sent.size >= MAX_PER_SESSION) return
    sent.add(key)
    void supabase
      .from('app_errors')
      .insert({
        message: `[${kind}] ${message}`.slice(0, 500),
        detail: [extra, detail].filter(Boolean).join('\n').slice(0, 2000) || null,
        path: window.location.pathname.slice(0, 200),
        user_agent: navigator.userAgent.slice(0, 300),
        standalone: isStandalone(),
      })
      .then(
        () => {},
        () => {},
      )
  } catch {
    /* o registro de erro nunca pode causar outro erro */
  }
}

/** Captura erros soltos (fora do React) e promessas que falharam sem tratamento. */
export function installGlobalErrorLog() {
  window.addEventListener('error', (e) => reportError('erro', e.error ?? e.message))
  window.addEventListener('unhandledrejection', (e) => reportError('promessa', e.reason))
}
