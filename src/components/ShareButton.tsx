import { useEffect, useRef, useState } from 'react'
import { Check, Copy, Share2 } from 'lucide-react'
import { WhatsAppIcon } from '@/components/ui/BrandIcons'

const TITLE = 'ArtExtreme Tattoo Studio'
const TEXT = 'Simule sua tattoo em 3D, veja o valor na hora e agende seu horário com o Mike:'

/**
 * Compartilhar o site com clientes. No celular abre o menu nativo do aparelho
 * (WhatsApp, Instagram, copiar...); onde não existe, mostra "Copiar link" e WhatsApp.
 */
export function ShareButton({
  className = 'btn btn-outline btn-sm',
  label = 'Compartilhar',
  labelClassName = '',
  path = '/',
}: {
  className?: string
  label?: string
  labelClassName?: string
  path?: string
}) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const url = new URL(path, window.location.origin).href

  // Fecha o menu ao tocar fora
  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: TITLE, text: TEXT, url })
        return
      } catch (e) {
        if ((e as Error).name === 'AbortError') return // a pessoa desistiu
      }
    }
    setOpen((v) => !v)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Navegador sem permissão: seleção manual como último recurso
      window.prompt('Copie o link:', url)
    }
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
      setOpen(false)
    }, 1400)
  }

  return (
    <div ref={box} className="relative inline-block">
      <button type="button" className={className} onClick={() => void share()} aria-expanded={open} aria-haspopup="menu">
        <Share2 size={16} />
        {label && <span className={labelClassName}>{label}</span>}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 animate-fade-up rounded-md border border-bone/15 bg-ash p-1.5 text-left shadow-xl"
        >
          <p className="truncate px-2.5 pt-1 pb-2 text-xs text-mute">{url}</p>
          <button type="button" role="menuitem" className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-sm hover:bg-bone/5" onClick={() => void copy()}>
            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            {copied ? 'Link copiado' : 'Copiar link'}
          </button>
          <a
            role="menuitem"
            className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-sm hover:bg-bone/5"
            href={`https://wa.me/?text=${encodeURIComponent(`${TEXT} ${url}`)}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
          >
            <WhatsAppIcon size={16} /> Enviar no WhatsApp
          </a>
        </div>
      )}
    </div>
  )
}
