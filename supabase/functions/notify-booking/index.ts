// ArtExtreme · Edge Function "notify-booking"
// Manda uma notificação para o celular do artista quando chega pedido novo.
//
// Chamada de dois jeitos:
//  1. Pelo Database Webhook do Supabase (INSERT em bookings), com o cabeçalho
//     x-webhook-secret. Avisa todos os aparelhos dos administradores.
//  2. Pelo botão "Enviar teste" do painel, com o login do artista. Avisa só
//     os aparelhos de quem clicou.
//
// Secrets (Supabase → Edge Functions → Secrets): VAPID_PUBLIC_KEY,
// VAPID_PRIVATE_KEY e WEBHOOK_SECRET. SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
// já vêm prontos no ambiente das Edge Functions.

import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

const env = (k: string) => {
  const v = Deno.env.get(k)
  if (!v) throw new Error(`Falta o secret ${k}`)
  return v
}

const db = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { persistSession: false },
})
webpush.setVapidDetails('mailto:artextremtv@gmail.com', env('VAPID_PUBLIC_KEY'), env('VAPID_PRIVATE_KEY'))

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

interface Payload {
  title: string
  body: string
  url: string
  tag: string
}

interface BookingRow {
  id: string
  client_name: string
  session_date: string
  start_time: string
  tattoo?: { placementLabels?: string[]; styleName?: string }
}

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

/** "Ana Souza · sex, 30/10 às 17:00" + locais e estilo */
export function bookingPayload(b: BookingRow): Payload {
  const [y, m, d] = b.session_date.split('-').map(Number)
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
  const when = `${weekday}, ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')} às ${b.start_time.slice(0, 5)}`
  const places = b.tattoo?.placementLabels?.filter(Boolean) ?? []
  const what = [places.slice(0, 3).join(', ') + (places.length > 3 ? ` +${places.length - 3}` : ''), b.tattoo?.styleName]
    .filter(Boolean)
    .join(' · ')
  return {
    title: 'Novo pedido de horário ✦',
    body: `${b.client_name} · ${when}${what ? `\n${what}` : ''}`,
    url: '/admin',
    tag: `booking-${b.id}`,
  }
}

/** Envia para os aparelhos e apaga os que não existem mais (app desinstalado etc.). */
async function sendToDevices(userIds: string[], payload: Payload) {
  if (!userIds.length) return { sent: 0, removed: 0, failed: 0 }
  const { data: subs, error } = await db
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .in('user_id', userIds)
  if (error) throw error

  let sent = 0
  let failed = 0
  const gone: string[] = []
  await Promise.all(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 24, urgency: 'high', topic: payload.tag.slice(0, 32).replace(/[^A-Za-z0-9_-]/g, '') },
        )
        sent++
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode
        if (code === 404 || code === 410) gone.push(s.endpoint)
        else {
          failed++
          console.error('push falhou', code, (e as Error).message)
        }
      }
    }),
  )
  if (gone.length) await db.from('push_subscriptions').delete().in('endpoint', gone)
  return { sent, removed: gone.length, failed }
}

async function adminIds(): Promise<string[]> {
  const { data, error } = await db.from('admins').select('user_id')
  if (error) throw error
  return (data ?? []).map((r) => r.user_id as string)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Use POST' }, 405)

  try {
    // 1. Webhook do banco: pedido novo
    const secret = req.headers.get('x-webhook-secret')
    if (secret) {
      if (secret !== env('WEBHOOK_SECRET')) return json({ error: 'Segredo inválido' }, 401)
      const body = await req.json()
      if (body?.type !== 'INSERT' || body?.table !== 'bookings' || !body?.record) return json({ skipped: true })
      const record = body.record as BookingRow & { status?: string }
      if (record.status && record.status !== 'pending') return json({ skipped: true })
      return json(await sendToDevices(await adminIds(), bookingPayload(record)))
    }

    // 2. Botão "Enviar teste" do painel (precisa estar logado como admin)
    const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return json({ error: 'Não autorizado' }, 401)
    const { data: auth, error: authError } = await db.auth.getUser(token)
    if (authError || !auth.user) return json({ error: 'Não autorizado' }, 401)
    const ids = await adminIds()
    if (!ids.includes(auth.user.id)) return json({ error: 'Apenas o artista pode testar' }, 403)

    return json(
      await sendToDevices([auth.user.id], {
        title: 'Notificações ativadas ✦',
        body: 'Tudo certo! Quando chegar um pedido de horário, o aviso aparece aqui.',
        url: '/admin',
        tag: 'teste',
      }),
    )
  } catch (e) {
    console.error(e)
    return json({ error: (e as Error).message }, 500)
  }
})
