/** Faixa de tamanho da tattoo (medida pelo maior lado, em cm). */
export interface SizeTier {
  id: string
  name: string
  /** Limite superior da faixa, em cm (inclusivo). */
  maxCm: number
  /** Valor base da faixa, antes dos multiplicadores de área e estilo. */
  basePrice: number
  /** Duração estimada da sessão, em horas. Usada para reservar a agenda. */
  hours: number
}

/** Região do corpo com multiplicador de dificuldade (dor, curvatura, pele). */
export interface BodyArea {
  id: string
  name: string
  multiplier: number
  active: boolean
}

export interface TattooStyle {
  id: string
  name: string
  description: string
  multiplier: number
  active: boolean
  /** Especialidade do artista: aparece em destaque no site e no simulador. */
  featured?: boolean
}

export interface PricingSettings {
  /** Valor mínimo cobrado por qualquer tattoo. */
  minPrice: number
  /** Multiplicador aplicado quando a tattoo é colorida. */
  colorMultiplier: number
  /** Margem da faixa de estimativa (0.15 = ±15%). */
  variance: number
  /** Percentual do sinal para garantir o horário (0.3 = 30%). */
  depositPercent: number
}

export interface PricingConfig {
  sizes: SizeTier[]
  areas: BodyArea[]
  styles: TattooStyle[]
  settings: PricingSettings
}

export interface StudioInfo {
  name: string
  artist: string
  email: string
  /** Somente dígitos, com DDI. Ex.: 5511999999999 */
  whatsapp: string
  instagram: string
  /** Chave Pix para o sinal (vai na mensagem de "pedir sinal"). */
  pixKey?: string
  address: string
  city: string
}

export interface ScheduleConfig {
  /** Dias de atendimento (0 = domingo ... 6 = sábado). */
  weekdays: number[]
  /** Horário de abertura, "HH:mm". */
  open: string
  /** Horário de fechamento, "HH:mm". */
  close: string
  /** Intervalo entre horários oferecidos, em minutos. */
  stepMinutes: number
  /** Quantos dias à frente o cliente pode agendar. */
  daysAhead: number
  /** Datas bloqueadas (folgas, convenções), "YYYY-MM-DD". */
  blockedDates: string[]
}

export type BookingStatus = 'pending' | 'confirmed' | 'done' | 'cancelled'

/** Um local marcado no corpo. Cada local é uma tattoo com tamanho próprio. */
export interface Placement {
  /** Zona exata clicada no corpo 3D (ex.: "antebraco_e"), ou null se escolhida pela lista. */
  zoneId: string | null
  areaId: string
  sizeCm: number
}

export interface TattooRequest {
  placements: Placement[]
  styleId: string
  color: boolean
  description: string
}

/** Valor de um local específico dentro da estimativa. */
export interface EstimateItem {
  areaId: string
  zoneId: string | null
  sizeCm: number
  tierName: string
  value: number
  hours: number
  oversized: boolean
}

export interface Estimate {
  low: number
  high: number
  value: number
  hours: number
  deposit: number
  /** Algum local acima da maior faixa: valor precisa ser avaliado pessoalmente. */
  oversized: boolean
  items: EstimateItem[]
}

export interface Booking {
  id: string
  createdAt: string
  status: BookingStatus
  client: {
    name: string
    phone: string
    instagram: string
  }
  tattoo: TattooRequest & {
    /** Nomes gravados no momento do pedido, caso o artista renomeie depois (mesma ordem de `placements`). */
    placementLabels: string[]
    styleName: string
  }
  estimate: Estimate
  date: string
  time: string
  notes: string
  /** Valor que o artista realmente cobrou (informado ao concluir). Sem ele, os relatórios usam a estimativa. */
  finalPrice?: number | null
}
