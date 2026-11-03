import type { Booking, StudioInfo } from '@/types'
import { formatBRL, formatDateLong, formatHours, onlyDigits, formatPriceRange } from './format'
import { COVER_LABEL, FIRST_TATTOO_TIPS } from './triage'

export function waLink(phone: string, text: string): string {
  return `https://wa.me/${onlyDigits(phone)}?text=${encodeURIComponent(text)}`
}

/** Mensagem que o cliente envia ao estúdio confirmando o pedido. */
export function bookingMessageToStudio(b: Booking): string {
  const t = b.tattoo
  const evaluation = b.kind === 'evaluation'
  return [
    evaluation
      ? `Olá! Acabei de enviar um pedido de avaliação pelo app ArtExtreme.`
      : `Olá! Acabei de solicitar um horário pelo app ArtExtreme.`,
    ``,
    `*Nome:* ${b.client.name}`,
    evaluation
      ? `*Avaliação:* ${b.cover ? COVER_LABEL[b.cover] : 'Projeto grande / fechamento'}`
      : `*Data:* ${formatDateLong(b.date)} às ${b.time}`,
    b.firstTattoo ? `*É minha primeira tattoo!* ✦` : null,
    `*Estilo:* ${t.styleName}${t.color ? ' (colorida)' : ' (preto e cinza)'}`,
    t.placements.length > 1 ? `*Locais:*` : `*Local:*`,
    ...t.placements.map((p, i) => `• ${t.placementLabels[i] ?? p.areaId}: ~${p.sizeCm} cm`),
    t.description ? `*Ideia:* ${t.description}` : null,
    evaluation
      ? `*Estimativa inicial:* a partir de ${formatBRL(b.estimate.low)}`
      : `*Estimativa:* ${formatPriceRange(b.estimate.low, b.estimate.high, ' a ')} (~${formatHours(b.estimate.hours)})`,
    ``,
    b.referencePath
      ? `Já mandei a foto pelo app, mas posso enviar mais referências por aqui.`
      : `Vou enviar as referências por aqui.`,
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
export type ClientMessageKind = 'chat' | 'deposit' | 'confirmed' | 'cancelled' | 'done' | 'evaluation'

export function clientMessage(kind: ClientMessageKind, b: Booking, studio: StudioInfo, siteUrl: string): string {
  const first = b.client.name.trim().split(/\s+/)[0]
  const hi = `Olá, ${first}! Aqui é o ${studio.artist}, da ${studio.name}.`
  // Avaliação ainda não tem data
  const when = b.date ? `${formatDateLong(b.date)} às ${b.time}` : 'a avaliação'
  const t = b.tattoo
  const places = t.placementLabels.join(', ')

  switch (kind) {
    case 'deposit':
      return [
        `${hi} 🖤`,
        ``,
        `Recebi seu pedido para *${when}*:`,
        `• ${t.styleName}${t.color ? ' colorida' : ''} · ${places}`,
        `• Estimativa: ${formatPriceRange(b.estimate.low, b.estimate.high, ' a ')}`,
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
        ...(b.firstTattoo
          ? [
              `Como vai ser a sua primeira tattoo, separei umas dicas: ✦`,
              ...FIRST_TATTOO_TIPS.map((tip) => `• ${tip}`),
              ``,
              `Fica tranquilo(a) que eu te explico tudo no dia. Até lá! 🖤`,
            ]
          : [
              `No dia: durma bem, coma antes de vir, evite bebida alcoólica na véspera e venha com uma roupa que deixe a região livre.`,
              `Qualquer dúvida é só chamar. Até lá!`,
            ]),
      ].join('\n')

    case 'evaluation':
      return [
        `${hi} 🖤`,
        ``,
        b.cover
          ? `Recebi seu pedido de *${COVER_LABEL[b.cover].toLowerCase()}* (${places}) e já vi a foto que você mandou.`
          : `Recebi seu pedido de avaliação para o projeto (${places}).`,
        b.firstTattoo ? `E que legal que vai ser a sua primeira tattoo! ✦` : null,
        ``,
        `Vamos conversar sobre a ideia? Me conta o que você imagina que eu te passo o valor e as datas livres.`,
      ]
        .filter((l) => l !== null)
        .join('\n')

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
      return b.date ? `${hi} Sobre o seu pedido para ${when}:` : `${hi} Sobre o seu pedido de avaliação:`
  }
}
