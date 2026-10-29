/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Project URL do Supabase. Sem ela, o app roda no modo local (dados no aparelho). */
  readonly VITE_SUPABASE_URL?: string
  /** Chave pública (publishable/anon) do Supabase. */
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
