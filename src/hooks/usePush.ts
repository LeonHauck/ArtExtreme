import { useCallback, useEffect, useState } from 'react'
import { disablePush, enablePush, getPushState, pushSupport, sendTestPush, type PushState } from '@/lib/push'

/** Estado e ações das notificações deste aparelho. */
export function usePush() {
  const support = pushSupport()
  const [state, setState] = useState<PushState | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const refresh = useCallback(async () => {
    if (support === 'ok') setState(await getPushState().catch(() => 'off' as const))
  }, [support])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const run = async (action: () => Promise<string | void>) => {
    setBusy(true)
    setMessage(null)
    try {
      const text = await action()
      if (text) setMessage({ ok: true, text })
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : 'Algo deu errado. Tente de novo.' })
    }
    await refresh()
    setBusy(false)
  }

  return {
    support,
    state,
    busy,
    message,
    enable: () =>
      run(async () => {
        await enablePush()
        // Já manda um teste para o artista ver como fica
        const sent = await sendTestPush().catch(() => 0)
        return sent ? 'Pronto! Enviamos uma notificação de teste.' : 'Notificações ativadas neste aparelho.'
      }),
    disable: () =>
      run(async () => {
        await disablePush()
        return 'Este aparelho não vai mais receber avisos.'
      }),
    test: () =>
      run(async () => {
        const sent = await sendTestPush()
        return sent ? `Teste enviado para ${sent} aparelho${sent > 1 ? 's' : ''}.` : 'Nenhum aparelho ativado ainda.'
      }),
  }
}
