import { useState } from 'react'
import { Bell, BellOff, BellRing, Loader2, Share, X } from 'lucide-react'
import { usePush } from '@/hooks/usePush'

const DISMISS_KEY = 'ae-push-banner-dismissed'

function readDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

function IosHint() {
  return (
    <p className="text-sm text-mute">
      No iPhone, os avisos só funcionam com o app instalado: abra no <strong className="text-bone">Safari</strong>, toque em{' '}
      <Share size={14} className="inline -translate-y-px" /> <strong className="text-bone">Compartilhar</strong> →{' '}
      <strong className="text-bone">Adicionar à Tela de Início</strong> e abra o painel pelo ícone.
    </p>
  )
}

/** Conteúdo do painel "Notificações" em Configurações. */
export function PushSettings() {
  const { support, state, busy, message, enable, disable, test } = usePush()

  if (support === 'ios-install') return <IosHint />
  if (support === 'unsupported') {
    return <p className="text-sm text-mute">Este navegador não aceita notificações. No Android use o Chrome; no iPhone, o app instalado pelo Safari.</p>
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${
            state === 'on' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-bone/15 text-mute'
          }`}
        >
          {state === 'on' ? <BellRing size={14} /> : <BellOff size={14} />}
          {state === 'on' ? 'Ativadas neste aparelho' : state === 'denied' ? 'Bloqueadas neste aparelho' : 'Desativadas neste aparelho'}
        </span>
        {state === 'on' ? (
          <>
            <button className="btn btn-outline btn-sm" disabled={busy} onClick={test}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Bell size={15} />} Enviar teste
            </button>
            <button className="btn btn-ghost btn-sm" disabled={busy} onClick={disable}>
              Desativar
            </button>
          </>
        ) : state === 'off' ? (
          <button className="btn btn-primary btn-sm" disabled={busy} onClick={enable}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Bell size={15} />} Ativar notificações
          </button>
        ) : null}
      </div>
      {state === 'denied' && (
        <p className="mt-3 text-sm text-mute">
          Para liberar: toque no cadeado ao lado do endereço (ou em Ajustes do celular → Notificações) e permita para o
          ArtExtreme. Depois volte aqui.
        </p>
      )}
      {message && <p className={`mt-3 text-sm ${message.ok ? 'text-emerald-400' : 'text-pink'}`}>{message.text}</p>}
      <p className="mt-3 text-xs text-mute">Ative em cada aparelho onde você quer receber o aviso de pedido novo.</p>
    </div>
  )
}

/** Convite no topo da Agenda enquanto as notificações estiverem desligadas. */
export function PushBanner() {
  const { support, state, busy, message, enable } = usePush()
  const [dismissed, setDismissed] = useState(readDismissed)

  const done = message?.ok && state === 'on'
  const show = !dismissed && (support === 'ios-install' || (support === 'ok' && (state === 'off' || done)))
  if (!show) return null

  const close = () => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* sem armazenamento: só esconde agora */
    }
  }

  return (
    <div className="card mt-5 flex items-start gap-3 border-violet/40 p-4" role="status">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet/15 text-violet-light">
        <BellRing size={18} />
      </span>
      <div className="min-w-0 flex-1">
        {done ? (
          <p className="text-sm text-emerald-400">{message.text}</p>
        ) : (
          <>
            <p className="font-semibold">Receba um aviso a cada pedido novo</p>
            {support === 'ios-install' ? (
              <div className="mt-1">
                <IosHint />
              </div>
            ) : (
              <>
                <p className="mt-0.5 text-sm text-mute">A notificação chega no celular mesmo com o app fechado.</p>
                <button className="btn btn-primary btn-sm mt-3" disabled={busy} onClick={enable}>
                  {busy ? <Loader2 size={15} className="animate-spin" /> : <Bell size={15} />} Ativar notificações
                </button>
                {message && !message.ok && <p className="mt-2 text-sm text-pink">{message.text}</p>}
              </>
            )}
          </>
        )}
      </div>
      <button className="btn btn-ghost btn-sm -mt-1 -mr-1 px-2" onClick={close} aria-label="Fechar">
        <X size={16} />
      </button>
    </div>
  )
}
