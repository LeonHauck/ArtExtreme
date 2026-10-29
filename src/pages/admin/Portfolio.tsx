import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Eye, EyeOff, ImagePlus, Images, Loader2, Trash2, Upload } from 'lucide-react'
import { Toggle } from '@/components/ui/Toggle'
import { InstagramIcon } from '@/components/ui/BrandIcons'
import { WORKS } from '@/data/content'
import { activeStyles, useStudio } from '@/store/studio'
import { isRemote } from '@/lib/supabase'
import {
  addWork,
  deleteWork,
  imageUrl,
  importStaticWorks,
  listPortfolio,
  saveOrder,
  updateWork,
  type PortfolioItem,
} from '@/lib/portfolioRepo'

/** Etiquetas sugeridas: estilos cadastrados + algumas comuns. */
function useTagOptions(current: (string | null)[]) {
  const styles = useStudio((s) => s.pricing.styles)
  return useMemo(() => {
    const base = activeStyles(styles).map((s) => s.name)
    const extra = ['Projeto autoral', 'Conceitual', 'Fechamento', 'Cobertura']
    const custom = current.filter((t): t is string => !!t)
    return [...new Set([...base, ...extra, ...custom])]
  }, [styles, current])
}

/** Campo de texto que salva ao sair do campo (ou Enter). */
function InlineText({
  value,
  placeholder,
  onSave,
  label,
}: {
  value: string
  placeholder?: string
  onSave: (v: string) => void
  label: string
}) {
  const [text, setText] = useState(value)
  useEffect(() => {
    setText(value)
  }, [value])
  return (
    <input
      className="input py-2 text-sm"
      aria-label={label}
      placeholder={placeholder}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => text !== value && onSave(text)}
      onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
    />
  )
}

function WorkCard({
  item,
  index,
  total,
  tags,
  onChange,
  onMove,
  onDelete,
}: {
  item: PortfolioItem
  index: number
  total: number
  tags: string[]
  onChange: (patch: Partial<PortfolioItem>) => void
  onMove: (dir: -1 | 1) => void
  onDelete: () => void
}) {
  return (
    <article className={`card overflow-hidden transition ${item.active ? '' : 'opacity-55'}`}>
      <div className="relative aspect-[3/4] bg-ash">
        <img src={imageUrl(item.image_path)} alt={item.title} loading="lazy" className="h-full w-full object-cover" />
        <span className="absolute top-2 left-2 rounded-full bg-ink/80 px-2 py-0.5 font-display text-sm tracking-wider backdrop-blur">
          #{index + 1}
        </span>
        {!item.active && (
          <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-ink/80 px-2 py-0.5 text-xs text-mute backdrop-blur">
            <EyeOff size={12} /> Oculta
          </span>
        )}
      </div>
      <div className="space-y-2.5 p-3">
        <InlineText label="Título" value={item.title} placeholder="Título" onSave={(title) => onChange({ title: title.trim() || 'Sem título' })} />
        <select
          className="input py-2 text-sm"
          aria-label="Etiqueta (estilo)"
          value={item.tag ?? ''}
          onChange={(e) => onChange({ tag: e.target.value || null })}
        >
          <option value="">Sem etiqueta</option>
          {tags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <div className="relative">
          <InstagramIcon size={14} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-mute" />
          <div className="[&_input]:pl-8">
            <InlineText
              label="Link do post no Instagram"
              value={item.instagram_url ?? ''}
              placeholder="Link do post (opcional)"
              onSave={(url) => onChange({ instagram_url: url.trim() || null })}
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 pt-1">
          <label className="flex items-center gap-2 text-xs text-mute">
            <Toggle checked={item.active} label="Mostrar no site" onChange={(active) => onChange({ active })} />
            {item.active ? <Eye size={14} /> : <EyeOff size={14} />}
          </label>
          <div className="flex items-center gap-1">
            <button className="btn btn-ghost btn-sm px-2" disabled={index === 0} onClick={() => onMove(-1)} aria-label="Mover para antes">
              <ArrowLeft size={16} />
            </button>
            <button className="btn btn-ghost btn-sm px-2" disabled={index === total - 1} onClick={() => onMove(1)} aria-label="Mover para depois">
              <ArrowRight size={16} />
            </button>
            <button
              className="btn btn-ghost btn-sm px-2 hover:text-pink"
              onClick={() => confirm(`Excluir "${item.title}"? A foto também será apagada.`) && onDelete()}
              aria-label="Excluir"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

export default function Portfolio() {
  const [items, setItems] = useState<PortfolioItem[] | null>(null)
  const [uploading, setUploading] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const tags = useTagOptions(items?.map((i) => i.tag) ?? [])

  const refresh = useCallback(async () => {
    try {
      setItems(await listPortfolio())
    } catch {
      setError('Não foi possível carregar o portfólio. Verifique a internet.')
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  if (!isRemote) {
    return (
      <div className="animate-fade-up">
        <h1 className="font-display text-4xl tracking-wide">Portfólio</h1>
        <p className="mt-4 max-w-lg text-mute">
          A gestão de fotos funciona quando o banco de dados (Supabase) está configurado. No modo local, o site mostra as
          fotos que vêm com o projeto.
        </p>
      </div>
    )
  }

  const guard = async (action: () => Promise<void>) => {
    setError(null)
    try {
      await action()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Algo deu errado. Tente de novo.')
    }
    await refresh()
  }

  const upload = async (files: FileList) => {
    const list = [...files].filter((f) => f.type.startsWith('image/'))
    if (!list.length) return
    setUploading(list.length)
    await guard(async () => {
      let pos = items?.length ?? 0
      for (const f of list) {
        await addWork(f, { title: f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').slice(0, 60) || 'Nova tattoo', position: pos++ })
        setUploading((n) => n - 1)
      }
    })
    setUploading(0)
  }

  const change = (item: PortfolioItem, patch: Partial<PortfolioItem>) => {
    // Atualiza na tela na hora e salva em seguida
    setItems((list) => list?.map((i) => (i.id === item.id ? { ...i, ...patch } : i)) ?? null)
    void guard(() => updateWork(item.id, patch))
  }

  const move = (index: number, dir: -1 | 1) => {
    if (!items) return
    const next = [...items]
    const [it] = next.splice(index, 1)
    next.splice(index + dir, 0, it)
    setItems(next)
    void guard(() => saveOrder(next))
  }

  const visible = items?.filter((i) => i.active).length ?? 0

  return (
    <div className="animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-wide">Portfólio</h1>
          <p className="mt-1 text-sm text-mute">
            Fotos do carrossel "Trabalhos recentes" do site.{' '}
            {items && items.length > 0 && `${visible} de ${items.length} visíveis.`}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => fileRef.current?.click()} disabled={uploading > 0}>
          {uploading > 0 ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
          {uploading > 0 ? `Enviando… (${uploading})` : 'Adicionar fotos'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) void upload(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      <p className="mt-3 text-xs text-mute">
        Dica: as fotos são recortadas no formato vertical (3:4), centralizadas, e comprimidas automaticamente. Use a seta
        para mudar a ordem.
      </p>

      {error && (
        <p className="mt-4 rounded-md border border-pink/40 bg-pink/10 p-3 text-sm" role="alert">
          {error}
        </p>
      )}

      {items === null ? (
        <div className="mt-16 flex justify-center text-mute">
          <Loader2 className="animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-bone/20 p-8 text-center">
          <Images className="mx-auto text-violet-light" size={36} strokeWidth={1.5} />
          <p className="mt-3 font-display text-2xl tracking-wide">Nenhuma foto no banco ainda</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-mute">
            Por enquanto o site mostra as {WORKS.length} fotos que vieram com o projeto. Importe essas fotos para poder
            editar, ou adicione novas.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <button
              className="btn btn-outline"
              disabled={uploading > 0}
              onClick={() => {
                setUploading(WORKS.length)
                void guard(() => importStaticWorks(WORKS, 0)).then(() => setUploading(0))
              }}
            >
              <Upload size={17} /> Importar as {WORKS.length} fotos atuais
            </button>
            <button className="btn btn-primary" onClick={() => fileRef.current?.click()} disabled={uploading > 0}>
              <ImagePlus size={17} /> Adicionar fotos novas
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item, i) => (
            <WorkCard
              key={item.id}
              item={item}
              index={i}
              total={items.length}
              tags={tags}
              onChange={(patch) => change(item, patch)}
              onMove={(dir) => move(i, dir)}
              onDelete={() => void guard(() => deleteWork(item))}
            />
          ))}
        </div>
      )}
    </div>
  )
}
