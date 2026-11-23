/** Faixa de tamanho da tattoo (medida pelo maior lado, em cm). */
export interface SizeTier {
  id: string
  name: string
  /** Limite superior da faixa, em cm (inclusivo). */
  maxCm: number
  /** Valor base da faixa, antes dos multiplicadores de área e estilo (não usado no modo por cm). */
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

/** Como o tamanho vira dinheiro: valor fixo por faixa, ou valor por centímetro. */
export type SizePricingMode = 'tier' | 'perCm'

export interface PricingSettings {
  /** Valor mínimo cobrado por qualquer tattoo. */
  minPrice: number
  /** Multiplicador aplicado quando a tattoo é colorida. */
  colorMultiplier: number
  /** Margem da faixa de estimativa (0.15 = ±15%). */
  variance: number
  /** Percentual do sinal para garantir o horário (0.3 = 30%). */
  depositPercent: number
  /** Faixa (padrão) ou por centímetro. Ausente = faixa (configurações antigas). */
  sizeMode?: SizePricingMode
  /** Valor de cada cm no modo por centímetro (maior lado da tattoo). */
  pricePerCm?: number
}

export interface PricingConfig {
  sizes: SizeTier[]
  areas: BodyArea[]
  styles: TattooStyle[]
  settings: PricingSettings
}

/** Visual do banner de promoção (sempre dentro da paleta do estúdio). */
export type PromoTheme = 'blackfriday' | 'gold' | 'rave' | 'fire' | 'xmas' | 'newyear' | 'easter'

/** Banner de promoção editável (Black Friday, Natal...). */
export interface PromoBanner {
  active: boolean
  title: string
  /** % de desconto em destaque (0 = não mostra o número) */
  percent: number
  text: string
  ctaLabel: string
  ctaLink: 'simulator' | 'booking' | 'whatsapp'
  theme: PromoTheme
  /** "YYYY-MM-DD"; vazio = sem data (começa já / não termina) */
  startsOn: string
  endsOn: string
  showHome: boolean
  showStrip: boolean
  /** Cupom ligado ao banner: o % vem dele e o código aparece no banner (vazio = % manual) */
  couponCode?: string
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
  /** Banner de promoção do site (editável na aba Promoções) */
  promo?: PromoBanner
  /** Popup do cupom (editável na aba Promoções) */
  couponPopup?: CouponPopup
}

/** Popup que oferece um cupom ao visitante, com timer individual. */
export interface CouponPopup {
  active: boolean
  /** Código do cupom oferecido (precisa existir e estar ativo na lista de cupons) */
  code: string
  title: string
  text: string
  /** Minutos do timer, contados a partir de quando o visitante vê o popup */
  timerMinutes: number
  /** Segundos navegando antes do popup aparecer */
  delaySeconds: number
}

/** Cupom de desconto cadastrado pelo artista. */
export interface Coupon {
  code: string
  percent: number
  active: boolean
  starts_on: string | null
  ends_on: string | null
  note: string | null
  created_at?: string
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
  /** Pausa depois de cada sessão (limpeza, montar a bancada), em minutos. 0 ou ausente = sem pausa. */
  bufferMinutes?: number
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
  /** Valores antes do cupom (só quando um cupom foi aplicado) */
  original?: { low: number; high: number; value: number; deposit: number }
}

/** Sessão com data, ou pedido de avaliação (cobertura, reforma, fechamento): sem data até o artista agendar. */
export type BookingKind = 'session' | 'evaluation'
/** Cobertura (cobrir uma tattoo antiga) ou reforma (refazer/restaurar). */
export type CoverType = 'cover' | 'rework'

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
  /** Ausente = sessão (pedidos antigos). Na avaliação, date e time ficam vazios. */
  kind?: BookingKind
  /** Resposta do cliente a "É sua primeira tattoo?" (null = não respondeu) */
  firstTattoo?: boolean | null
  cover?: CoverType | null
  /** Foto de referência: caminho no armazenamento privado (ou imagem local no modo sem banco) */
  referencePath?: string | null
  /** Cupom usado no pedido (o % é sempre o oficial, conferido pelo banco) */
  coupon?: { code: string; percent: number } | null
  /** Quem criou: o cliente pelo site, ou o artista pelo painel ("studio"). Ausente = cliente. */
  origin?: 'client' | 'studio'
}
