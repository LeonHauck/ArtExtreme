import type { Booking } from '@/types'
import { formatBRL, formatDateLong, formatHours, onlyDigits } from './format'

export function waLink(phone: string, text: string): string {
  return `https://wa.me/${onlyDigits(phone)}?text=${encodeURIComponent(text)}`
}

/** Mensagem que o cliente envia ao estúdio confirmando o pedido. */
export function bookingMessageToStudio(b: Booking): string {
  const t = b.tattoo
  return [
    `Olá! Acabei de solicitar um horário pelo app ArtExtreme.`,
    ``,
    `*Nome:* ${b.client.name}`,
    `*Data:* ${formatDateLong(b.date)} às ${b.time}`,
    `*Estilo:* ${t.styleName}${t.color ? ' (colorida)' : ' (preto e cinza)'}`,
    t.placements.length > 1 ? `*Locais:*` : `*Local:*`,
    ...t.placements.map((p, i) => `• ${t.placementLabels[i] ?? p.areaId}: ~${p.sizeCm} cm`),
    t.description ? `*Ideia:* ${t.description}` : null,
    `*Estimativa:* ${formatBRL(b.estimate.low)} a ${formatBRL(b.estimate.high)} (~${formatHours(b.estimate.hours)})`,
    ``,
    `Vou enviar as referências por aqui.`,
  ]
    .filter((line) => line !== null)
    .join('\n')
}

/** Mensagem que o artista envia ao cliente a partir do painel. */
export function bookingMessageToClient(b: Booking, studioName: string): string {
  const first = b.client.name.split(' ')[0]
  const statusLine =
    b.status === 'confirmed'
      ? `Seu horário está *confirmado* para ${formatDateLong(b.date)} às ${b.time}.`
      : `Recebemos seu pedido para ${formatDateLong(b.date)} às ${b.time}.`
  return `Olá, ${first}! Aqui é do ${studioName}. ${statusLine}`
}
