import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_ADMIN_PIN, defaultPricing, defaultSchedule, defaultStudio } from '@/data/defaults'
import type {
  Booking,
  BookingStatus,
  BodyArea,
  Placement,
  PricingConfig,
  PricingSettings,
  ScheduleConfig,
  StudioInfo,
  TattooRequest,
  TattooStyle,
} from '@/types'

type PricingList = 'sizes' | 'areas' | 'styles'
type PricingItem<K extends PricingList> = PricingConfig[K][number]

/** Máximo de locais num mesmo pedido. */
export const MAX_PLACEMENTS = 8
export const DEFAULT_SIZE_CM = 10

export const emptyDraft: TattooRequest = {
  placements: [],
  styleId: '',
  color: false,
  description: '',
}

/** Dois locais são o mesmo se apontam para a mesma zona (ou a mesma área, quando escolhidos pela lista). */
const samePlacement = (a: Pick<Placement, 'zoneId' | 'areaId'>, b: Pick<Placement, 'zoneId' | 'areaId'>) =>
  a.zoneId !== null || b.zoneId !== null ? a.zoneId === b.zoneId : a.areaId === b.areaId

interface StudioState {
  pricing: PricingConfig
  studio: StudioInfo
  schedule: ScheduleConfig
  bookings: Booking[]
  adminPin: string
  /** Seleção atual do cliente no simulador, levada para o agendamento. */
  draft: TattooRequest

  setDraft: (patch: Partial<TattooRequest>) => void
  resetDraft: () => void
  /** Marca ou desmarca um local (zona do 3D ou área da lista). */
  togglePlacement: (p: Pick<Placement, 'zoneId' | 'areaId'>) => void
  setPlacementSize: (index: number, sizeCm: number) => void
  removePlacement: (index: number) => void

  addBooking: (b: Booking) => void
  setBookingStatus: (id: string, status: BookingStatus) => void
  removeBooking: (id: string) => void

  upsertPricingItem: <K extends PricingList>(list: K, item: PricingItem<K>) => void
  removePricingItem: (list: PricingList, id: string) => void
  updatePricingSettings: (patch: Partial<PricingSettings>) => void
  resetPricing: () => void

  updateStudio: (patch: Partial<StudioInfo>) => void
  updateSchedule: (patch: Partial<ScheduleConfig>) => void
  setAdminPin: (pin: string) => void

  exportData: () => string
  importData: (json: string) => void
}

/** Substitui o item com o mesmo id ou adiciona no fim. */
function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  const i = list.findIndex((x) => x.id === item.id)
  if (i === -1) return [...list, item]
  const copy = [...list]
  copy[i] = item
  return copy
}

const setPlacements = (s: StudioState, placements: Placement[]) => ({ draft: { ...s.draft, placements } })

export const useStudio = create<StudioState>()(
  persist(
    (set, get) => ({
      pricing: defaultPricing,
      studio: defaultStudio,
      schedule: defaultSchedule,
      bookings: [],
      adminPin: DEFAULT_ADMIN_PIN,
      draft: emptyDraft,

      setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
      resetDraft: () => set({ draft: emptyDraft }),
      togglePlacement: (p) =>
        set((s) => {
          const list = s.draft.placements
          const exists = list.some((x) => samePlacement(x, p))
          if (exists) return setPlacements(s, list.filter((x) => !samePlacement(x, p)))
          if (list.length >= MAX_PLACEMENTS) return {}
          return setPlacements(s, [...list, { ...p, sizeCm: DEFAULT_SIZE_CM }])
        }),
      setPlacementSize: (index, sizeCm) =>
        set((s) => setPlacements(s, s.draft.placements.map((p, i) => (i === index ? { ...p, sizeCm } : p)))),
      removePlacement: (index) => set((s) => setPlacements(s, s.draft.placements.filter((_, i) => i !== index))),

      addBooking: (b) => set((s) => ({ bookings: [...s.bookings, b] })),
      setBookingStatus: (id, status) =>
        set((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? { ...b, status } : b)) })),
      removeBooking: (id) => set((s) => ({ bookings: s.bookings.filter((b) => b.id !== id) })),

      upsertPricingItem: (list, item) =>
        set((s) => ({
          pricing: { ...s.pricing, [list]: upsert(s.pricing[list] as { id: string }[], item) },
        })),
      removePricingItem: (list, id) =>
        set((s) => ({
          pricing: {
            ...s.pricing,
            [list]: (s.pricing[list] as { id: string }[]).filter((x) => x.id !== id),
          },
        })),
      updatePricingSettings: (patch) =>
        set((s) => ({ pricing: { ...s.pricing, settings: { ...s.pricing.settings, ...patch } } })),
      resetPricing: () => set({ pricing: defaultPricing }),

      updateStudio: (patch) => set((s) => ({ studio: { ...s.studio, ...patch } })),
      updateSchedule: (patch) => set((s) => ({ schedule: { ...s.schedule, ...patch } })),
      setAdminPin: (adminPin) => set({ adminPin }),

      exportData: () => {
        const { pricing, studio, schedule, bookings } = get()
        return JSON.stringify({ version: 3, pricing, studio, schedule, bookings }, null, 2)
      },
      importData: (json) => {
        const data = JSON.parse(json)
        if (!data?.pricing?.sizes || !data?.studio || !data?.schedule) {
          throw new Error('Arquivo de backup inválido.')
        }
        set({
          pricing: data.pricing,
          studio: data.studio,
          schedule: data.schedule,
          bookings: Array.isArray(data.bookings) ? data.bookings.map(migrateBooking) : [],
        })
      },
    }),
    {
      name: 'artextreme-studio',
      version: 4,
      migrate: (persisted, version) => {
        const state = persisted as StudioState
        if (version < 2) {
          // v2: dados reais do estúdio, campo de e-mail e estilos com especialidades em destaque
          const wasPlaceholder = state.studio?.whatsapp === '5500000000000'
          state.studio = wasPlaceholder ? defaultStudio : { ...defaultStudio, ...state.studio }
          state.pricing = { ...state.pricing, styles: defaultPricing.styles }
        }
        if (version < 3) {
          // v3: vários locais por pedido e zonas frente/trás (novas áreas de preço)
          state.pricing = { ...state.pricing, areas: mergeAreas(state.pricing.areas) }
          state.draft = emptyDraft
          state.bookings = (state.bookings ?? []).map(migrateBooking)
        }
        if (version < 4) {
          // v4: chave Pix e outros campos novos do estúdio
          state.studio = { ...defaultStudio, ...state.studio }
        }
        return state
      },
    },
  ),
)

/** Áreas novas entram com o valor padrão; as existentes mantêm os ajustes do artista. */
function mergeAreas(current: BodyArea[] = []): BodyArea[] {
  const byId = new Map(current.map((a) => [a.id, a]))
  const defaults = defaultPricing.areas.map((d) => ({ ...d, ...byId.get(d.id), name: d.name }))
  const defaultIds = new Set(defaultPricing.areas.map((a) => a.id))
  const removed = new Set(['perna'])
  const custom = current.filter((a) => !defaultIds.has(a.id) && !removed.has(a.id))
  return [...defaults, ...custom]
}

/** Converte agendamentos do formato antigo (um local só) para a lista de locais. */
function migrateBooking(b: Booking): Booking {
  const t = b.tattoo as unknown as Record<string, unknown>
  if (Array.isArray(t.placements)) return b
  return {
    ...b,
    tattoo: {
      placements: [{ zoneId: (t.zoneId as string) ?? null, areaId: t.areaId as string, sizeCm: t.sizeCm as number }],
      placementLabels: [t.areaLabel as string],
      styleId: t.styleId as string,
      styleName: t.styleName as string,
      color: !!t.color,
      description: (t.description as string) ?? '',
    },
    estimate: { ...b.estimate, items: b.estimate.items ?? [] },
  }
}

// Helpers de seleção
export const activeAreas = (areas: BodyArea[]) => areas.filter((a) => a.active)
export const activeStyles = (styles: TattooStyle[]) => styles.filter((s) => s.active)
