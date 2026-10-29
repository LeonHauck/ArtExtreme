import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

/**
 * Cliente do Supabase, ou `null` quando as variáveis não estão configuradas.
 * Nesse caso o app funciona no "modo local" (dados só no aparelho), útil para
 * desenvolvimento e para quem clona o repositório sem ter um projeto.
 */
export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
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
