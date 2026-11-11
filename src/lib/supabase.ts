import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

/**
 * Cliente do Supabase, ou `null` quando as variáveis não estão configuradas.
 * Nesse caso o app funciona no "modo local" (dados só no aparelho), útil para
 * desenvolvimento e para quem clona o repositório sem ter um projeto.
 */
/**
 * Internet ruim no celular pode deixar um pedido "pendurado" para sempre
 * (tela carregando sem fim). Com o tempo-limite, ele falha e o app mostra
 * a mensagem de erro com "Tentar de novo".
 */
const TIMEOUT_MS = 25_000
const fetchWithTimeout: typeof fetch = (input, init = {}) => {
  const timeout = AbortSignal.timeout?.(TIMEOUT_MS)
  if (!timeout) return fetch(input, init) // navegador antigo: segue sem tempo-limite
  const signal = !init.signal ? timeout : AbortSignal.any ? AbortSignal.any([init.signal, timeout]) : init.signal
  return fetch(input, { ...init, signal })
}

export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        global: { fetch: fetchWithTimeout },
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          // "implicit": o link de redefinição de senha funciona mesmo se for
          // aberto em outro aparelho (ex.: pedir no PC e abrir o e-mail no celular).
          flowType: 'implicit',
        },
      })
    : null

export const isRemote = supabase !== null
