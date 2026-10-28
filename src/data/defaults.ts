import type { PricingConfig, ScheduleConfig, StudioInfo } from '@/types'

/**
 * Valores iniciais de exemplo. O artista ajusta tudo pelo painel
 * em /admin/precos — estes números são só um ponto de partida.
 */
export const defaultPricing: PricingConfig = {
  sizes: [
    { id: 'mini', name: 'Mini', maxCm: 5, basePrice: 200, hours: 1 },
    { id: 'pequena', name: 'Pequena', maxCm: 10, basePrice: 350, hours: 1.5 },
    { id: 'media', name: 'Média', maxCm: 15, basePrice: 600, hours: 2.5 },
    { id: 'grande', name: 'Grande', maxCm: 25, basePrice: 1000, hours: 4 },
    { id: 'extra', name: 'Extra grande', maxCm: 40, basePrice: 1700, hours: 6 },
  ],
  areas: [
    { id: 'cabeca', name: 'Cabeça', multiplier: 1.4, active: true },
    { id: 'pescoco', name: 'Pescoço (frente)', multiplier: 1.3, active: true },
    { id: 'nuca', name: 'Nuca', multiplier: 1.15, active: true },
    { id: 'ombro', name: 'Ombro', multiplier: 1.0, active: true },
    { id: 'peito', name: 'Peito', multiplier: 1.15, active: true },
    { id: 'costela', name: 'Costela', multiplier: 1.35, active: true },
    { id: 'abdomen', name: 'Abdômen', multiplier: 1.2, active: true },
    { id: 'costas', name: 'Costas', multiplier: 1.0, active: true },
    { id: 'lombar', name: 'Lombar', multiplier: 1.1, active: true },
    { id: 'braco', name: 'Braço (bíceps)', multiplier: 1.0, active: true },
    { id: 'triceps', name: 'Braço (tríceps)', multiplier: 1.0, active: true },
    { id: 'antebraco', name: 'Antebraço interno', multiplier: 1.05, active: true },
    { id: 'antebraco_externo', name: 'Antebraço externo', multiplier: 1.0, active: true },
    { id: 'mao', name: 'Mão', multiplier: 1.3, active: true },
    { id: 'coxa', name: 'Coxa (frente)', multiplier: 1.0, active: true },
    { id: 'posterior_coxa', name: 'Posterior da coxa', multiplier: 1.1, active: true },
    { id: 'canela', name: 'Canela', multiplier: 1.15, active: true },
    { id: 'panturrilha', name: 'Panturrilha', multiplier: 1.0, active: true },
    { id: 'pe', name: 'Pé', multiplier: 1.3, active: true },
  ],
  styles: [
    {
      id: 'blackwork',
      name: 'Blackwork',
      description: 'Preto sólido, contraste máximo e desenho autoral.',
      multiplier: 1.15,
      active: true,
      featured: true,
    },
    {
      id: 'rastelado',
      name: 'Rastelado',
      description: 'Sombreado texturizado, construído em camadas de traço.',
      multiplier: 1.25,
      active: true,
      featured: true,
    },
    { id: 'fineline', name: 'Fine Line', description: 'Traços finos e delicados.', multiplier: 1.0, active: true },
    { id: 'pontilhismo', name: 'Pontilhismo', description: 'Sombras construídas ponto a ponto.', multiplier: 1.3, active: true },
    { id: 'ornamental', name: 'Ornamental', description: 'Mandalas, padrões e simetria.', multiplier: 1.2, active: true },
    { id: 'realismo', name: 'Realismo', description: 'Retratos e sombras realistas em preto e cinza.', multiplier: 1.5, active: true },
    { id: 'lettering', name: 'Lettering', description: 'Escritas e caligrafia.', multiplier: 0.95, active: true },
  ],
  settings: {
    minPrice: 180,
    colorMultiplier: 1.2,
    variance: 0.15,
    depositPercent: 0.3,
  },
}

export const defaultStudio: StudioInfo = {
  name: 'ArtExtreme',
  artist: 'Mike',
  email: 'artextremtv@gmail.com',
  whatsapp: '5532991809867',
  instagram: 'tattooartextremee',
  address: 'Av. Simeão de Faria, 440 · Bloco A, Sala 203',
  city: 'Juiz de Fora - MG',
}

export const defaultSchedule: ScheduleConfig = {
  weekdays: [2, 3, 4, 5, 6],
  open: '10:00',
  close: '19:00',
  stepMinutes: 60,
  daysAhead: 60,
  blockedDates: [],
}

/** PIN inicial do painel. Trocar em Configurações. */
export const DEFAULT_ADMIN_PIN = '1234'
