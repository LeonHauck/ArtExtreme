import { lazy, type ComponentType } from 'react'
import { reportError } from './errorLog'

/**
 * Depois de publicar uma versão nova, os arquivos do app mudam de nome. Quem
 * estava com o app aberto (ou em segundo plano) ainda tenta buscar os antigos,
 * que não existem mais, e a tela ficava vazia. Aqui o app percebe isso e
 * recarrega sozinho, uma vez, já na versão nova.
 */

const KEY = 'ae-reloaded-at'
const WINDOW_MS = 30_000

export function isChunkError(err: unknown): boolean {
  const text = err instanceof Error ? `${err.name} ${err.message}` : String(err)
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError|Loading chunk|preload CSS|Unable to preload/i.test(text)
}

/** Recarrega a página, mas no máximo uma vez a cada 30 s (evita ficar em loop). */
export function reloadOnce(): boolean {
  try {
    const last = Number(sessionStorage.getItem(KEY) || 0)
    if (Date.now() - last < WINDOW_MS) return false
    sessionStorage.setItem(KEY, String(Date.now()))
  } catch {
    /* sem sessionStorage: recarrega mesmo assim */
  }
  window.location.reload()
  return true
}

/** `React.lazy` que se recupera quando o arquivo da página sumiu numa atualização. */
export function lazyPage<T extends ComponentType<object>>(load: () => Promise<{ default: T }>) {
  return lazy(() =>
    load().catch((err) => {
      if (isChunkError(err)) {
        reportError('versao-nova', err, 'recarregando para a versão publicada')
        // Enquanto recarrega, a tela de carregamento continua (nunca fica vazia)
        if (reloadOnce()) return new Promise<{ default: T }>(() => {})
      }
      throw err
    }),
  )
}

/** O Vite avisa quando falha ao pré-carregar partes do app: mesmo tratamento. */
export function installChunkRecovery() {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault()
    reloadOnce()
  })
}
