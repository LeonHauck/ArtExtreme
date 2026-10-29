import { supabase } from '@/lib/supabase'

/**
 * Chave pública das notificações (VAPID). É pública mesmo: a parte secreta
 * fica só nos Secrets da Edge Function no Supabase.
 */
export const VAPID_PUBLIC_KEY = 'BDtm_3K25lvJ_UzcnH8--3poBJNhPtv_bRokFYungWIBQ-J_Yn0sTDiynXwY9yK2oeWMnjb0nePMuV8Ja0Ag2UA'

export type PushSupport = 'ok' | 'ios-install' | 'unsupported'
export type PushState = 'on' | 'off' | 'denied'

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

/** O app está aberto pelo ícone (instalado), e não pelo navegador. */
export function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
}

export function pushSupport(): PushSupport {
  const apis = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  // No iPhone, notificação só funciona com o app instalado na tela de início (iOS 16.4+)
  if (isIOS() && !isStandalone()) return 'ios-install'
  return apis ? 'ok' : 'unsupported'
}

/** Nome amigável do aparelho, para saber de onde veio a inscrição. */
function deviceName() {
  const ua = navigator.userAgent
  const os = /android/i.test(ua) ? 'Android' : isIOS() ? 'iPhone/iPad' : /windows/i.test(ua) ? 'Windows' : /mac/i.test(ua) ? 'Mac' : 'Outro'
  const browser = /edg\//i.test(ua) ? 'Edge' : /samsungbrowser/i.test(ua) ? 'Samsung' : /firefox/i.test(ua) ? 'Firefox' : /chrome|crios/i.test(ua) ? 'Chrome' : /safari/i.test(ua) ? 'Safari' : 'Navegador'
  return `${os} · ${browser}${isStandalone() ? ' (app)' : ''}`
}

function keyToBytes(base64url: string) {
  const pad = '='.repeat((4 - (base64url.length % 4)) % 4)
  const raw = atob((base64url + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

/** Service worker do PWA (só existe no site publicado, não no `npm run dev`). */
async function registration(): Promise<ServiceWorkerRegistration> {
  const reg = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((r) => setTimeout(() => r(null), 6000)),
  ])
  if (!reg) throw new Error('Notificações só funcionam no site publicado (artextreme.vercel.app).')
  return reg
}

async function currentSubscription() {
  const reg = await navigator.serviceWorker.getRegistration()
  return (await reg?.pushManager.getSubscription()) ?? null
}

async function save(sub: PushSubscription) {
  const j = sub.toJSON()
  const { error } = await supabase!.rpc('save_push_subscription', {
    p_endpoint: sub.endpoint,
    p_p256dh: j.keys?.p256dh,
    p_auth: j.keys?.auth,
    p_device: deviceName(),
  })
  if (error) throw new Error('Não foi possível salvar este aparelho. Tente de novo.')
}

export async function getPushState(): Promise<PushState> {
  if (Notification.permission === 'denied') return 'denied'
  return (await currentSubscription()) && Notification.permission === 'granted' ? 'on' : 'off'
}

/** Pede permissão, inscreve o aparelho e salva no banco. */
export async function enablePush(): Promise<void> {
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error(permission === 'denied' ? 'As notificações foram bloqueadas neste aparelho.' : 'Permissão não concedida.')
  }
  const reg = await registration()
  let sub = await reg.pushManager.getSubscription()
  // Se a inscrição antiga foi feita com outra chave, recria
  const oldKey = sub?.options.applicationServerKey
  if (sub && oldKey && new Uint8Array(oldKey).toString() !== keyToBytes(VAPID_PUBLIC_KEY).toString()) {
    await sub.unsubscribe()
    sub = null
  }
  try {
    sub ??= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(VAPID_PUBLIC_KEY) })
  } catch {
    throw new Error('Este navegador não conseguiu ativar as notificações. No Android, use o Chrome.')
  }
  await save(sub)
}

/** Para de receber neste aparelho. */
export async function disablePush(): Promise<void> {
  const sub = await currentSubscription()
  if (!sub) return
  await supabase?.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
  await sub.unsubscribe()
}

/** Reenvia a inscrição deste aparelho (mantém o banco em dia ao abrir o painel). */
export async function syncPush(): Promise<void> {
  if (pushSupport() !== 'ok' || Notification.permission !== 'granted') return
  const sub = await currentSubscription()
  if (sub) await save(sub)
}

/** Manda uma notificação de teste para os aparelhos de quem está logado. */
export async function sendTestPush(): Promise<number> {
  const { data, error } = await supabase!.functions.invoke<{ sent: number }>('notify-booking', { body: { test: true } })
  if (error) throw new Error('O servidor de notificações ainda não está configurado (veja supabase/README.md, passo 7).')
  return data?.sent ?? 0
}
