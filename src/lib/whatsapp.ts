import type { Booking, StudioInfo } from '@/types'
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

/** Telefone no formato do WhatsApp (com DDI 55). */
export const toWhatsAppNumber = (phone: string) => {
  const d = onlyDigits(phone)
  return d.length <= 11 ? `55${d}` : d
}

/** Número do cliente do pedido no formato do WhatsApp. */
export const clientWhatsApp = (b: Booking) => toWhatsAppNumber(b.client.phone)

/** Mensagens que o artista manda ao cliente a partir do painel (com 1 toque). */
export type ClientMessageKind = 'chat' | 'deposit' | 'confirmed' | 'cancelled' | 'done'

export function clientMessage(kind: ClientMessageKind, b: Booking, studio: StudioInfo, siteUrl: string): string {
  const first = b.client.name.trim().split(/\s+/)[0]
  const hi = `Olá, ${first}! Aqui é o ${studio.artist}, da ${studio.name}.`
  const when = `${formatDateLong(b.date)} às ${b.time}`
  const t = b.tattoo
  const places = t.placementLabels.join(', ')

  switch (kind) {
    case 'deposit':
      return [
        `${hi} 🖤`,
        ``,
        `Recebi seu pedido para *${when}*:`,
        `• ${t.styleName}${t.color ? ' colorida' : ''} · ${places}`,
        `• Estimativa: ${formatBRL(b.estimate.low)} a ${formatBRL(b.estimate.high)}`,
        ``,
        `Para garantir o horário, o sinal é de *${formatBRL(b.estimate.deposit)}* (abatido no valor final).`,
        studio.pixKey ? `Pix: *${studio.pixKey}*` : null,
        ``,
        `Me manda o comprovante e suas referências por aqui que eu confirmo. 😉`,
      ]
        .filter((l) => l !== null)
        .join('\n')

    case 'confirmed':
      return [
        `${hi} 🖤`,
        ``,
        `Seu horário está *confirmado*! ✅`,
        `📅 ${when}`,
        `📍 ${studio.address} · ${studio.city}`,
        ``,
        `No dia: durma bem, coma antes de vir, evite bebida alcoólica na véspera e venha com uma roupa que deixe a região livre.`,
        `Qualquer dúvida é só chamar. Até lá!`,
      ].join('\n')

    case 'cancelled':
      return [
        hi,
        ``,
        `Seu horário de *${when}* foi cancelado.`,
        `Se quiser remarcar, escolha um novo horário por aqui: ${siteUrl}/agendar`,
      ].join('\n')

    case 'done':
      return [
        `Valeu demais, ${first}! 🙌 Foi um prazer tatuar você.`,
        ``,
        `Os cuidados nos próximos dias fazem toda a diferença no resultado. O passo a passo está aqui: ${siteUrl}/#cuidados`,
        ``,
        `Se curtiu, posta e marca a gente no Instagram: @${studio.instagram} 🖤`,
      ].join('\n')

    default:
      return `${hi} Sobre o seu pedido para ${when}:`
  }
}
