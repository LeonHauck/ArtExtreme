/**
 * Sessão do painel do artista.
 *
 * ATENÇÃO: nesta fase os dados ficam no próprio aparelho e o PIN é apenas
 * uma trava de interface. Quando o backend (Supabase) entrar, isto vira
 * login real com e-mail/senha e regras de acesso no banco.
 */
const KEY = 'artextreme-admin-session'

export function isAdminSession(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function startAdminSession() {
  try {
    sessionStorage.setItem(KEY, '1')
  } catch {
    /* modo privado: a sessão vale só enquanto a página estiver aberta */
  }
}

export function endAdminSession() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
