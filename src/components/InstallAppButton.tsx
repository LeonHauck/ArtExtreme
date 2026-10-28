import { useEffect, useState, type ReactNode } from 'react'
import { Download, Share, SquarePlus, X } from 'lucide-react'

/** Evento do Chrome/Android que permite abrir a instalação nativa do app. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()

// Captura o evento o quanto antes (ele dispara uma única vez, no carregamento)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
    listeners.forEach((fn) => fn())
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    listeners.forEach((fn) => fn())
  })
}

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

/**
 * "Instalar app": no Android abre a instalação nativa; no iPhone mostra o
 * passo a passo do Safari. Some quando o app já está instalado.
 */
export function InstallAppButton({ className = 'btn btn-outline btn-sm', label = 'Instalar app' }: { className?: string; label?: string }) {
  const [, force] = useState(0)
  const [help, setHelp] = useState(false)
  const [installed, setInstalled] = useState(() => typeof window !== 'undefined' && isStandalone())

  useEffect(() => {
    const update = () => {
      force((n) => n + 1)
      setInstalled(isStandalone())
    }
    listeners.add(update)
    return () => {
      listeners.delete(update)
    }
  }, [])

  if (installed) return null

  const onClick = async () => {
    if (deferred) {
      await deferred.prompt()
      const { outcome } = await deferred.userChoice
      if (outcome === 'accepted') deferred = null
      force((n) => n + 1)
    } else {
      setHelp(true)
    }
  }

  return (
    <>
      <button type="button" onClick={onClick} className={className}>
        <Download size={16} /> {label}
      </button>
      {help && <InstallHelp onClose={() => setHelp(false)} />}
    </>
  )
}

function InstallHelp({ onClose }: { onClose: () => void }) {
  const ios = isIOS()
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/70 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-title"
        className="card w-full max-w-sm animate-fade-up p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="install-title" className="font-display text-2xl tracking-wide">
            Instalar o app
          </h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-mute hover:text-bone" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <p className="mt-1 text-sm text-mute">O ArtExtreme fica na tela inicial e abre em tela cheia, como um aplicativo.</p>
        <ol className="mt-5 space-y-4 text-sm">
          {ios ? (
            <>
              <Step n={1}>
                No <b>Safari</b>, toque em <Share size={16} className="inline text-violet-light" /> <b>Compartilhar</b>.
              </Step>
              <Step n={2}>
                Role e toque em <SquarePlus size={16} className="inline text-violet-light" /> <b>Adicionar à Tela de Início</b>.
              </Step>
              <Step n={3}>
                Toque em <b>Adicionar</b>. Pronto!
              </Step>
            </>
          ) : (
            <>
              <Step n={1}>
                Abra o menu do navegador (<b>⋮</b> no Chrome).
              </Step>
              <Step n={2}>
                Toque em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.
              </Step>
              <Step n={3}>
                Confirme em <b>Instalar</b>. Pronto!
              </Step>
            </>
          )}
        </ol>
      </div>
    </div>
  )
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet font-display text-sm">{n}</span>
      <span className="text-bone/85">{children}</span>
    </li>
  )
}
