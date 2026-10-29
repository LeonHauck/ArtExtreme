import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Logo } from '@/components/brand/Logo'
import { Ornament } from '@/components/ui/Ornament'

/** Moldura das telas de acesso (login, esqueci a senha, nova senha). */
export function AuthCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: ReactNode
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-violet/25 blur-[110px]" />
      <div className="pointer-events-none absolute -right-40 -bottom-40 h-[24rem] w-[24rem] rounded-full bg-flame/15 blur-[110px]" />
      <div className="card relative w-full max-w-sm animate-fade-up p-7 text-center sm:p-8">
        <div className="flex justify-center">
          <Logo />
        </div>
        <Ornament className="my-6" />
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-violet/40 bg-violet/15 text-violet-light">
          {icon}
        </div>
        <h1 className="font-display text-2xl tracking-wider">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-mute">{subtitle}</p>}
        <div className="mt-6 text-left">{children}</div>
        <Link to="/" className="mt-6 inline-block text-sm text-mute hover:text-bone">
          ← Voltar ao site
        </Link>
      </div>
    </div>
  )
}

/** Campo de senha com botão "mostrar". */
export function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  autoFocus,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  autoComplete: 'current-password' | 'new-password'
  autoFocus?: boolean
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        className="input pr-20"
        value={value}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        required
      />
      <button
        type="button"
        className="absolute top-1/2 right-2 -translate-y-1/2 rounded px-2 py-1 text-xs text-mute hover:text-bone"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
      >
        {visible ? 'ocultar' : 'mostrar'}
      </button>
    </div>
  )
}
