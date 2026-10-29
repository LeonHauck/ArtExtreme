import { supabase } from './supabase'
import { uid } from './format'
import type { Work } from '@/data/content'

/**
 * Portfólio no Supabase: metadados na tabela `portfolio_items` e fotos no
 * bucket público `portfolio`. Só o artista logado consegue alterar.
 */

const BUCKET = 'portfolio'

export interface PortfolioItem {
  id: string
  title: string
  tag: string | null
  image_path: string
  instagram_url: string | null
  position: number
  active: boolean
}

export const imageUrl = (path: string) => supabase!.storage.from(BUCKET).getPublicUrl(path).data.publicUrl

export const toWork = (item: PortfolioItem): Work => ({
  src: imageUrl(item.image_path),
  title: item.title,
  tag: item.tag ?? undefined,
  url: item.instagram_url ?? '',
})

/** Itens do portfólio em ordem. O visitante só recebe os ativos (regra do banco). */
export async function listPortfolio(): Promise<PortfolioItem[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('portfolio_items').select('*').order('position', { ascending: true })
  if (error) throw error
  return data as PortfolioItem[]
}

/**
 * Prepara a foto no navegador antes de enviar: recorta no formato 3:4 do
 * carrossel (centralizado) e comprime em JPEG. Uma foto de 5 MB do celular
 * vira algo em torno de 200 KB.
 */
export async function prepareImage(file: Blob, width = 1080, height = 1440): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.max(width / bitmap.width, height / bitmap.height)
  const w = bitmap.width * scale
  const h = bitmap.height * scale
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, (width - w) / 2, (height - h) / 2, w, h)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Não foi possível processar a imagem.'))), 'image/jpeg', 0.85),
  )
}

/** Envia uma foto e cria o item no fim da lista. */
export async function addWork(
  file: Blob,
  meta: { title: string; tag?: string | null; instagram_url?: string | null; position: number },
): Promise<void> {
  if (!supabase) throw new Error('Portfólio disponível só com o banco configurado.')
  const image = await prepareImage(file)
  const path = `works/${uid()}.jpg`
  const up = await supabase.storage.from(BUCKET).upload(path, image, { contentType: 'image/jpeg', cacheControl: '31536000' })
  if (up.error) throw up.error
  const { error } = await supabase.from('portfolio_items').insert({
    title: meta.title.trim() || 'Sem título',
    tag: meta.tag?.trim() || null,
    instagram_url: meta.instagram_url?.trim() || null,
    image_path: path,
    position: meta.position,
  })
  if (error) {
    await supabase.storage.from(BUCKET).remove([path])
    throw error
  }
}

export async function updateWork(id: string, patch: Partial<Omit<PortfolioItem, 'id' | 'image_path'>>): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('portfolio_items').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteWork(item: PortfolioItem): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('portfolio_items').delete().eq('id', item.id)
  if (error) throw error
  await supabase.storage.from(BUCKET).remove([item.image_path])
}

/** Grava a nova ordem (posição = índice na lista). */
export async function saveOrder(items: PortfolioItem[]): Promise<void> {
  if (!supabase) return
  const client = supabase
  const results = await Promise.all(
    items.map((it, i) => client.from('portfolio_items').update({ position: i }).eq('id', it.id)),
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) throw failed.error
}

/** Primeiro uso: copia as fotos que já estão no site para o banco. */
export async function importStaticWorks(works: Work[], startPosition: number): Promise<void> {
  for (const [i, w] of works.entries()) {
    const res = await fetch(w.src)
    if (!res.ok) continue
    await addWork(await res.blob(), { title: w.title, tag: w.tag, instagram_url: w.url, position: startPosition + i })
  }
}
