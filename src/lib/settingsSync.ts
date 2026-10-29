import { create } from 'zustand'
import { supabase } from './supabase'
import { defaultStudio } from '@/data/defaults'
import { useStudio } from '@/store/studio'
import { useAuth } from '@/store/auth'
import type { PricingConfig, ScheduleConfig, StudioInfo } from '@/types'

/**
 * Preços, dados do estúdio e horários ficam numa linha da tabela
 * `studio_settings`. Todo visitante carrega de lá; quando o artista muda algo
 * no painel, salvamos automaticamente (com um pequeno atraso para juntar edições).
 */

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error'
export const useSync = create<{ status: SyncStatus; loaded: boolean }>(() => ({ status: 'idle', loaded: !supabase }))

interface SettingsRow {
  pricing: PricingConfig
  studio: StudioInfo
  schedule: ScheduleConfig
}

let applyingRemote = false
let hasRemoteRow = false

export async function loadRemoteSettings() {
  if (!supabase) return
  const { data, error } = await supabase.from('studio_settings').select('pricing, studio, schedule').eq('id', 1).maybeSingle()
  if (!error && data) {
    hasRemoteRow = true
    const row = data as SettingsRow
    applyingRemote = true
    // Campos novos (ex.: chave Pix) entram com o valor padrão
    useStudio.setState({ pricing: row.pricing, studio: { ...defaultStudio, ...row.studio }, schedule: row.schedule })
    applyingRemote = false
  }
  useSync.setState({ loaded: true })
  // Artista já logado e banco ainda vazio: envia as configurações atuais
  if (!error && !data && useAuth.getState().isAdmin) void save()
}

async function save() {
  if (!supabase) return
  const { pricing, studio, schedule } = useStudio.getState()
  useSync.setState({ status: 'saving' })
  const { error } = await supabase
    .from('studio_settings')
    .upsert({ id: 1, pricing, studio, schedule, updated_at: new Date().toISOString() })
  hasRemoteRow = hasRemoteRow || !error
  useSync.setState({ status: error ? 'error' : 'saved' })
}

/** Começa a salvar automaticamente as mudanças feitas pelo artista. */
export function startSettingsAutosave(): () => void {
  if (!supabase) return () => {}
  let timer: number | undefined

  const stopStudio = useStudio.subscribe((s, prev) => {
    if (applyingRemote || !useAuth.getState().isAdmin) return
    if (s.pricing === prev.pricing && s.studio === prev.studio && s.schedule === prev.schedule) return
    window.clearTimeout(timer)
    useSync.setState({ status: 'saving' })
    timer = window.setTimeout(save, 700)
  })

  // Primeiro acesso do artista: se o banco ainda não tem configurações, envia as atuais
  const stopAuth = useAuth.subscribe((a, prev) => {
    if (a.isAdmin && !prev.isAdmin && useSync.getState().loaded && !hasRemoteRow) void save()
  })

  return () => {
    window.clearTimeout(timer)
    stopStudio()
    stopAuth()
  }
}
