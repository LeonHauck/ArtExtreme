import { useEffect, useState } from 'react'
import { WORKS, type Work } from '@/data/content'
import { isRemote } from '@/lib/supabase'
import { listPortfolio, toWork } from '@/lib/portfolioRepo'

/**
 * Trabalhos do carrossel: os do banco (gerenciados pelo Mike no painel) ou,
 * enquanto o banco estiver vazio/indisponível, as fotos que vêm com o site.
 */
export function usePortfolioWorks(): Work[] {
  const [works, setWorks] = useState<Work[]>(WORKS)

  useEffect(() => {
    if (!isRemote) return
    let alive = true
    listPortfolio()
      .then((items) => {
        const active = items.filter((i) => i.active)
        if (alive && active.length) setWorks(active.map(toWork))
      })
      .catch(() => {
        /* sem internet: mantém as fotos do site */
      })
    return () => {
      alive = false
    }
  }, [])

  return works
}
