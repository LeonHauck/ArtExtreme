import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RotateCw } from 'lucide-react'
import { isChunkError, reloadOnce } from '@/lib/chunkReload'
import { reportError } from '@/lib/errorLog'

interface State {
  error: Error | null
  reloading: boolean
}

/**
 * Rede de segurança: se qualquer parte do app quebrar, em vez de uma tela vazia
 * aparece um aviso com "Recarregar". Erro de versão antiga recarrega sozinho.
 */
export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null, reloading: false }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError('tela', error, info.componentStack?.slice(0, 1200))
    if (isChunkError(error) && reloadOnce()) this.setState({ reloading: true })
  }

  render() {
    const { error, reloading } = this.state
    if (!error) return this.props.children
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <div className="card max-w-sm p-7">
          <p className="font-display text-3xl tracking-wide">{reloading ? 'Atualizando…' : 'Algo deu errado'}</p>
          <p className="mt-2 text-sm text-mute">
            {reloading
              ? 'Saiu uma versão nova do app. Só um instante.'
              : 'O app encontrou um problema e parou esta tela. Recarregar costuma resolver.'}
          </p>
          {!reloading && (
            <div className="mt-6 flex flex-col gap-2">
              <button type="button" className="btn btn-primary w-full" onClick={() => window.location.reload()}>
                <RotateCw size={17} /> Recarregar
              </button>
              <a href="/" className="btn btn-ghost w-full">
                Voltar ao início
              </a>
            </div>
          )}
        </div>
      </div>
    )
  }
}
