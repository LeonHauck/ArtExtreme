import { supabase } from './supabase'

/**
 * Foto de referência do pedido (tattoo a cobrir/reformar, ou o projeto).
 * Fica num armazenamento PRIVADO: o cliente só envia; o artista vê por um
 * link temporário. No modo sem banco, vira uma imagem pequena no aparelho.
 */

const BUCKET = 'references'

/** Reduz para no máximo `maxSide` px no maior lado, em JPEG (sem cortar). */
export async function compressPhoto(file: File, maxSide: number, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', quality))
  if (!blob) throw new Error('Não foi possível ler essa foto. Tente outra.')
  return blob
}

const toDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(new Error('Não foi possível ler essa foto.'))
    r.readAsDataURL(blob)
  })

/** Envia a foto e devolve o caminho para gravar no pedido. */
export async function uploadReference(file: File): Promise<string> {
  if (!supabase) return toDataUrl(await compressPhoto(file, 720, 0.75))
  const blob = await compressPhoto(file, 1600)
  const path = `pending/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false })
  if (error) throw new Error('Não foi possível enviar a foto. Verifique sua internet e tente de novo.')
  return path
}

/** Link para o artista ver a foto (vale 1 hora). */
export async function referenceUrl(path: string): Promise<string | null> {
  if (path.startsWith('data:')) return path
  if (!supabase) return null
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60)
  return data?.signedUrl ?? null
}

export async function removeReference(path: string): Promise<void> {
  if (!supabase || path.startsWith('data:')) return
  await supabase.storage.from(BUCKET).remove([path])
}
