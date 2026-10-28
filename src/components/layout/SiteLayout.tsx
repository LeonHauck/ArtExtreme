import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { CalendarDays, Home, Mail, MapPin, ScanLine } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { InstallAppButton } from '@/components/InstallAppButton'
import { InstagramIcon, WhatsAppIcon } from '@/components/ui/BrandIcons'
import { NeonRule } from '@/components/ui/Ornament'
import { useStudio } from '@/store/studio'
import { waLink } from '@/lib/whatsapp'
import { formatWhatsApp } from '@/lib/format'

const NAV = [
  { to: '/', label: 'Início', icon: Home, end: true },
  { to: '/orcamento', label: 'Orçamento', icon: ScanLine, end: false },
  { to: '/agendar', label: 'Agendar', icon: CalendarDays, end: false },
]

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-bone/5 bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" aria-label="ArtExtreme — início" className="shrink-0">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `relative px-3 py-2 font-display text-lg tracking-wider uppercase transition lg:px-4 ${
                  isActive
                    ? 'text-bone after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-rave'
                    : 'text-bone/60 hover:text-bone'
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
          <Link to="/orcamento" className="btn btn-primary btn-sm ml-2 lg:ml-3">
            Simular tattoo
          </Link>
        </nav>
      </div>
    </header>
  )
}

/** Navegação inferior: dá a sensação de app nativo no celular. */
function BottomNav() {
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-bone/10 bg-ink/95 backdrop-blur-md md:hidden">
      <ul className="grid grid-cols-3">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex h-16 flex-col items-center justify-center gap-0.5 font-display text-xs tracking-widest uppercase transition ${
                  isActive ? 'text-violet-light drop-shadow-[0_0_8px_rgba(190,56,243,0.7)]' : 'text-mute'
                }`
              }
            >
              <Icon size={21} strokeWidth={1.7} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function Footer() {
  const studio = useStudio((s) => s.studio)
  return (
    <footer className="relative mt-24 border-t border-bone/5 bg-coal/70 pb-24 md:pb-0">
      <NeonRule className="absolute inset-x-0 top-0" />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 text-center md:grid-cols-[1.2fr_1fr] md:text-left">
          <div className="flex flex-col items-center gap-4 md:items-start">
            <Logo size="lg" />
            <p className="max-w-sm text-sm text-mute">
              Blackwork e Rastelado premiados. Desenho autoral, criado do briefing à pele.
            </p>
            <div className="flex flex-wrap justify-center gap-2 md:justify-start">
              <a
                href={`https://instagram.com/${studio.instagram}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline btn-sm"
              >
                <InstagramIcon size={18} /> @{studio.instagram}
              </a>
              <a
                href={waLink(studio.whatsapp, 'Olá! Gostaria de fazer um orçamento.')}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline btn-sm"
              >
                <WhatsAppIcon size={18} /> WhatsApp
              </a>
              <InstallAppButton />
            </div>
          </div>
          <ul className="space-y-3 text-sm text-bone/80">
            <li className="flex justify-center gap-2.5 md:justify-start">
              <MapPin size={17} className="mt-0.5 shrink-0 text-flame" />
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(`${studio.address}, ${studio.city}`)}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-bone"
              >
                {studio.address}
                <br />
                <span className="text-mute">{studio.city}</span>
              </a>
            </li>
            {studio.email && (
              <li className="flex justify-center gap-2.5 md:justify-start">
                <Mail size={17} className="mt-0.5 shrink-0 text-flame" />
                <a href={`mailto:${studio.email}`} className="hover:text-bone">
                  {studio.email}
                </a>
              </li>
            )}
            {studio.whatsapp && (
              <li className="flex justify-center gap-2.5 md:justify-start">
                <WhatsAppIcon size={17} className="mt-0.5 shrink-0 text-flame" />
                <a
                  href={waLink(studio.whatsapp, 'Olá! Gostaria de fazer um orçamento.')}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-bone"
                >
                  {formatWhatsApp(studio.whatsapp)}
                </a>
              </li>
            )}
          </ul>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-bone/5 pt-6 text-xs text-mute/70 sm:flex-row">
          <span>
            © {new Date().getFullYear()} {studio.name} Tattoo Studio
          </span>
          <span>
            Desenvolvido por{' '}
            <a
              href="https://www.linkedin.com/in/leon-hauck/"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-bone/80 underline-offset-4 transition hover:text-violet-light hover:underline"
            >
              Leon Hauck
            </a>
          </span>
          <Link to="/admin" className="hover:text-bone">
            Área do artista
          </Link>
        </div>
      </div>
    </footer>
  )
}

export function SiteLayout() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
