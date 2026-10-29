import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  ArrowRight,
  Ban,
  CalendarDays,
  Clock,
  Cpu,
  Droplets,
  MapPin,
  PenTool,
  ScanLine,
  ShieldCheck,
  UtensilsCrossed,
} from 'lucide-react'
import { Mark } from '@/components/brand/Logo'
import { Ornament, SectionTitle } from '@/components/ui/Ornament'
import { InstagramIcon } from '@/components/ui/BrandIcons'
import { Medal } from '@/components/ui/Medal'
import { activeStyles, useStudio } from '@/store/studio'
import { formatBRL } from '@/lib/format'
import { sortedSizes } from '@/lib/pricing'
import { ARTIST, ASEPSIS, AWARDS, BIO, CARE_AVOID, CARE_GUIDE, TIMELINE } from '@/data/content'
import { usePortfolioWorks } from '@/hooks/usePortfolioWorks'
import { WorksCarousel } from '@/components/WorksCarousel'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const YEARS = new Date().getFullYear() - ARTIST.since

const STEPS = [
  { icon: ScanLine, title: 'Escolha o local', text: 'Gire o corpo 3D e toque na região onde vai a tattoo.' },
  { icon: PenTool, title: 'Tamanho e estilo', text: 'Defina o tamanho e o estilo. O valor estimado aparece na hora.' },
  { icon: CalendarDays, title: 'Agende', text: 'Escolha dia e horário livres e envie suas referências no WhatsApp.' },
]

const FAQ = [
  {
    q: 'O valor do simulador é o valor final?',
    a: 'É uma estimativa. O valor final é fechado depois que o Mike vê suas referências e cria o concept, porque detalhes e sombreados mudam o tempo de trabalho.',
  },
  {
    q: 'Como funciona a criação do desenho?',
    a: 'A partir da sua ideia é feito um briefing e um concept digital (Photoshop, Concepts, ArtFlow) para você aprovar antes da sessão.',
  },
  { q: 'Preciso pagar sinal?', a: 'Sim. O sinal garante seu horário e é abatido do valor da tattoo no dia.' },
  { q: 'Menor de idade pode tatuar?', a: 'Apenas maiores de 18 anos, com documento com foto no dia da sessão.' },
]

/* Manchas de luz animadas no fundo: clima de pista */
function RaveGlow({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <div className="absolute -top-32 -left-24 h-[28rem] w-[28rem] animate-glow rounded-full bg-violet/30 blur-[110px]" />
      <div className="absolute top-40 -right-32 h-[24rem] w-[24rem] animate-glow rounded-full bg-flame/20 blur-[110px] [animation-delay:-3s]" />
      <div className="absolute bottom-0 left-1/3 h-64 w-64 animate-glow rounded-full bg-pink/15 blur-[100px] [animation-delay:-1.5s]" />
    </div>
  )
}

function AwardsCard() {
  return (
    <div className="card relative overflow-hidden p-6 sm:p-7">
      <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-sun/15 blur-3xl" />
      <p className="eyebrow">Premiado</p>
      <p className="mt-1 flex items-end gap-2 font-display leading-none">
        <span className="text-rave text-7xl sm:text-8xl">6x</span>
        <span className="mb-2 text-2xl tracking-wide text-bone/90">premiações</span>
      </p>
      <div className="mt-4 flex gap-1.5">
        {AWARDS.map((a, i) => (
          <Medal key={i} place={a.place} size={28} />
        ))}
      </div>
      <p className="mt-4 text-sm text-mute">
        Em <span className="text-bone">Blackwork</span> e <span className="text-bone">Rastelado</span>: 4 primeiros
        lugares, 1 segundo e 1 terceiro.
      </p>
    </div>
  )
}

function Hero() {
  const studio = useStudio((s) => s.studio)
  return (
    <section className="relative overflow-hidden">
      <RaveGlow />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pt-10 pb-16 sm:px-6 md:pt-16 lg:grid-cols-[1.25fr_1fr] lg:gap-14 lg:pt-20 lg:pb-24">
        <div className="text-center lg:text-left">
          <p className="eyebrow animate-fade-up">Tattoo Studio · {studio.city}</p>
          <h1 className="mt-4 animate-fade-up [animation-delay:80ms]">
            <img
              src="/brand/graffiti.webp"
              alt="ArtExtreme"
              width={1200}
              height={537}
              className="mx-auto w-full max-w-[560px] drop-shadow-[0_0_30px_rgba(190,56,243,0.45)] lg:mx-0"
            />
          </h1>
          <p className="mt-4 animate-fade-up font-display text-3xl leading-tight tracking-wide [animation-delay:160ms] sm:text-4xl">
            <span className="text-rave">Blackwork &amp; Rastelado</span>
            <span className="text-bone"> com assinatura.</span>
          </p>
          <p className="mx-auto mt-4 max-w-lg animate-fade-up text-mute [animation-delay:240ms] lg:mx-0">
            Monte sua tattoo no corpo 3D, veja um valor estimado na hora e reserve seu horário com o {studio.artist}.
          </p>
          <div className="mt-8 flex animate-fade-up flex-col justify-center gap-3 [animation-delay:320ms] sm:flex-row lg:justify-start">
            <Link to="/orcamento" className="btn btn-rave">
              Simular minha tattoo <ArrowRight size={18} />
            </Link>
            <Link to="/agendar" className="btn btn-outline">
              Agendar horário
            </Link>
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-md animate-fade-up gap-4 [animation-delay:400ms] sm:max-w-2xl sm:grid-cols-2 lg:max-w-none lg:grid-cols-1">
          <AwardsCard />
          <ul className="card grid grid-cols-3 divide-x divide-bone/10 p-4 text-center sm:grid-cols-1 sm:divide-x-0 sm:divide-y sm:p-0 lg:grid-cols-3 lg:divide-x lg:divide-y-0 lg:p-4">
            <li className="flex flex-col justify-center px-2 sm:p-4 lg:p-0">
              <p className="font-display text-3xl tracking-wide text-bone">{YEARS}+</p>
              <p className="text-xs text-mute">anos tatuando</p>
            </li>
            <li className="flex flex-col justify-center px-2 sm:p-4 lg:p-0">
              <p className="font-display text-3xl tracking-wide text-bone">{ARTIST.founded}</p>
              <p className="text-xs text-mute">ArtExtreme fundada</p>
            </li>
            <li className="flex flex-col justify-center px-2 sm:p-4 lg:p-0">
              <ShieldCheck className="mx-auto text-violet-light" size={28} strokeWidth={1.6} />
              <p className="mt-0.5 text-xs text-mute">material descartável</p>
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}

/** Faixa rolante com os estilos: fita neon atravessando a página. */
function StyleMarquee() {
  const styles = useStudio((s) => s.pricing.styles)
  const names = useMemo(() => activeStyles(styles).map((s) => s.name), [styles])
  if (!names.length) return null
  const row = [...names, ...names, ...names]

  return (
    // O wrapper corta as pontas da faixa inclinada (evita rolagem lateral no celular)
    <div className="relative z-10 overflow-hidden py-10">
      <div className="-ml-[5%] w-[110%] -rotate-[1.5deg] overflow-hidden bg-rave py-3 shadow-[0_0_40px_-6px_rgba(190,56,243,0.6)]">
      <div className="flex w-max animate-marquee">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
            {row.map((name, i) => (
              <span key={`${copy}-${i}`} className="flex items-center font-display text-2xl tracking-[0.2em] text-ink uppercase">
                <span className="px-6">{name}</span>
                <span className="text-ink/50">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
      </div>
    </div>
  )
}

/** Texturas que evocam cada técnica, feitas só com CSS. */
const SPECIALTY_ART: Record<string, string> = {
  blackwork:
    'bg-[repeating-conic-gradient(from_0deg_at_80%_45%,rgba(0,0,0,0.95)_0deg_12deg,transparent_12deg_24deg)]',
  rastelado:
    'bg-[repeating-linear-gradient(115deg,rgba(243,238,250,0.18)_0_1px,transparent_1px_5px)]',
}

function Specialties() {
  const styles = useStudio((s) => s.pricing.styles)
  const setDraft = useStudio((s) => s.setDraft)
  const navigate = useNavigate()
  const featured = useMemo(() => activeStyles(styles).filter((s) => s.featured), [styles])
  if (!featured.length) return null

  return (
    <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
      <SectionTitle
        eyebrow="Especialidades"
        title={
          <>
            Onde o <span className="text-rave">Mike</span> é referência
          </>
        }
        subtitle="As técnicas que renderam as premiações e dão identidade ao trabalho da ArtExtreme."
      />
      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {featured.map((s, i) => (
          <article
            key={s.id}
            className="group relative flex min-h-72 flex-col overflow-hidden rounded-xl border border-bone/10 bg-ash p-7 transition hover:border-violet/60 hover:shadow-[0_0_50px_-15px_var(--color-violet)] sm:p-9"
          >
            <div
              className={`pointer-events-none absolute inset-y-0 right-0 w-3/4 opacity-60 transition duration-500 [mask-image:linear-gradient(to_left,black,transparent)] group-hover:opacity-100 ${
                SPECIALTY_ART[s.id] ?? SPECIALTY_ART.rastelado
              }`}
            />
            <div
              className={`pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full blur-3xl ${i % 2 ? 'bg-flame/25' : 'bg-violet/30'}`}
            />
            <span className="relative inline-flex w-fit items-center gap-1.5 rounded-full border border-sun/40 bg-sun/10 px-2.5 py-1 text-xs font-medium text-sun">
              <Mark size={14} /> Especialidade premiada
            </span>
            <h3 className="relative mt-5 font-display text-5xl tracking-wide sm:text-6xl">{s.name}</h3>
            <p className="relative mt-2 max-w-xs text-bone/75">{s.description}</p>
            <button
              type="button"
              onClick={() => {
                setDraft({ styleId: s.id })
                navigate('/orcamento')
              }}
              className="relative mt-auto inline-flex w-fit items-center gap-2 pt-8 font-display text-lg tracking-wider text-violet-light uppercase transition group-hover:gap-3"
            >
              Simular em {s.name} <ArrowRight size={18} />
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

function Artist() {
  const instagram = useStudio((s) => s.studio.instagram)
  return (
    <section className="relative mx-auto max-w-6xl px-4 pt-24 sm:px-6">
      <div className="grid items-center gap-12 md:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        {/* Retrato em moldura editorial: cartão neon inclinado atrás + assinatura com avatar */}
        <div className="relative mx-auto w-full max-w-[19rem] sm:max-w-[22rem] lg:max-w-[25rem]">
          <div className="absolute -inset-6 rounded-[2rem] bg-violet/25 blur-3xl" />
          <div className="absolute inset-0 translate-x-3 translate-y-3 rotate-3 rounded-2xl bg-rave opacity-85" />
          <div className="relative overflow-hidden rounded-2xl border border-bone/15 bg-ash shadow-2xl">
            <img
              src={ARTIST.photo}
              alt={`${ARTIST.name}, tatuador da ArtExtreme`}
              width={720}
              height={900}
              loading="lazy"
              className="aspect-[4/5] w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-ink/95 via-ink/50 to-transparent" />
            <div className="absolute bottom-4 left-4 flex items-center gap-3">
              <img
                src={ARTIST.avatar}
                alt=""
                width={44}
                height={44}
                loading="lazy"
                className="h-11 w-11 rounded-full object-cover ring-2 ring-violet-light"
              />
              <div className="leading-tight">
                <p className="font-display text-2xl tracking-wide text-bone">{ARTIST.name}</p>
                <p className="font-marker text-sm text-sun">@{instagram}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <SectionTitle
            align="left"
            eyebrow="O artista"
            title={
              <>
                {ARTIST.name}: <span className="text-rave">{ARTIST.origin.toLowerCase()}</span>, tatuador desde {ARTIST.since}
              </>
            }
          />
          <div className="mt-6 space-y-4 text-bone/80">
            {BIO.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
          <ol className="mt-8 grid gap-3 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
            {TIMELINE.map((t) => (
              <li key={t.year} className="flex gap-3 rounded-lg border border-bone/10 bg-coal/60 p-3.5 sm:flex-col sm:gap-1 md:flex-row md:gap-3 lg:flex-col lg:gap-1">
                <span className="font-marker text-xl text-flame">{t.year}</span>
                <span className="text-sm text-mute">{t.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

function Works() {
  const instagram = useStudio((s) => s.studio.instagram)
  const works = usePortfolioWorks()
  return (
    // Título dentro do container; a esteira ocupa a largura toda da tela
    <section className="pt-24">
      <div className="mx-auto mb-10 flex max-w-6xl flex-col items-start justify-between gap-4 px-4 sm:flex-row sm:items-end sm:px-6">
        <SectionTitle
          align="left"
          eyebrow="Portfólio"
          title={
            <>
              Trabalhos <span className="text-rave">recentes</span>
            </>
          }
          subtitle="Pause quando quiser olhar com calma ou arraste para o lado. Toque em uma tattoo para abrir o post no Instagram."
        />
        <a
          href={`https://instagram.com/${instagram}`}
          target="_blank"
          rel="noreferrer"
          className="btn btn-outline btn-sm shrink-0"
        >
          <InstagramIcon size={17} /> Ver tudo
        </a>
      </div>
      <WorksCarousel works={works} />
    </section>
  )
}

function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
      <SectionTitle
        eyebrow="Tecnologia a favor da sua tattoo"
        title="Da ideia à agulha"
        subtitle="Simule, veja o valor e garanta seu horário em poucos toques."
      />
      <Ornament className="mt-6" />
      <ol className="mt-12 grid gap-4 sm:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="card group relative overflow-hidden p-6 transition hover:border-violet/50 lg:p-7">
            <span className="absolute -top-3 right-3 font-marker text-7xl text-bone/5 transition group-hover:text-violet/20">
              {i + 1}
            </span>
            <Icon className="text-flame" size={28} strokeWidth={1.6} />
            <h3 className="mt-5 font-display text-2xl tracking-wide">{title}</h3>
            <p className="mt-2 text-sm text-mute">{text}</p>
          </li>
        ))}
      </ol>
      <div className="mt-8 flex justify-center">
        <Link to="/orcamento" className="btn btn-primary">
          <Cpu size={18} /> Abrir simulador 3D
        </Link>
      </div>
    </section>
  )
}

function OtherStyles() {
  const pricing = useStudio((s) => s.pricing)
  const styles = useMemo(() => activeStyles(pricing.styles).filter((s) => !s.featured), [pricing.styles])
  const from = useMemo(() => {
    const smallest = sortedSizes(pricing.sizes)[0]
    return smallest ? Math.max(pricing.settings.minPrice, smallest.basePrice) : pricing.settings.minPrice
  }, [pricing])
  if (!styles.length) return null

  return (
    <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
      <SectionTitle eyebrow="Também fazemos" title="Outros estilos" subtitle={`Tattoos a partir de ${formatBRL(from)}.`} />
      <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {styles.map((s) => (
          <article key={s.id} className="group rounded-lg border border-bone/10 bg-coal/70 p-5 transition hover:border-violet/40 hover:bg-ash">
            <h3 className="font-display text-2xl tracking-wide transition group-hover:text-violet-light">{s.name}</h3>
            <p className="mt-1 text-sm text-mute">{s.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function Care() {
  return (
    <section id="cuidados" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-24 sm:px-6">
      <SectionTitle
        eyebrow="Pós-tattoo"
        title="Como cuidar da sua tattoo"
        subtitle="Seguir os cuidados é metade do resultado. Guarde esse passo a passo."
      />
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {CARE_GUIDE.map((step, i) => (
          <div key={step.title} className="card p-6">
            <p className="font-marker text-lg text-flame">Etapa {i + 1}</p>
            <h3 className="mt-1 font-display text-2xl tracking-wide">{step.title}</h3>
            <ul className="mt-4 space-y-2 text-sm text-bone/80">
              {step.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="card p-6">
          <h3 className="flex items-center gap-2 font-display text-xl tracking-wide">
            <Droplets size={18} className="text-violet-light" /> Assepsia
          </h3>
          <p className="mt-3 text-sm text-bone/80">{ASEPSIS}</p>
        </div>
        <div className="card p-6">
          <h3 className="flex items-center gap-2 font-display text-xl tracking-wide">
            <UtensilsCrossed size={18} className="text-flame" /> Evite comer
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {CARE_AVOID.food.map((f) => (
              <span key={f} className="rounded-full border border-flame/30 bg-flame/10 px-2.5 py-1 text-xs text-bone/85">
                {f}
              </span>
            ))}
          </div>
        </div>
        <div className="card p-6">
          <h3 className="flex items-center gap-2 font-display text-xl tracking-wide">
            <Ban size={18} className="text-pink" /> Não faça
          </h3>
          <ul className="mt-3 space-y-1.5 text-sm text-bone/80">
            {CARE_AVOID.actions.map((a) => (
              <li key={a}>· {a}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

function InstagramCta() {
  const studio = useStudio((s) => s.studio)
  return (
    <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
      <div className="relative overflow-hidden rounded-2xl border border-bone/10 bg-ash p-8 text-center sm:p-12 md:p-16">
        <RaveGlow className="opacity-70" />
        <div className="relative">
          <InstagramIcon size={34} className="mx-auto text-violet-light" />
          <h2 className="mt-4 font-display text-4xl tracking-wide sm:text-5xl">Acompanhe no Instagram</h2>
          <p className="mx-auto mt-3 max-w-md text-bone/70">Trabalhos novos toda semana, depoimentos de clientes e bastidores do estúdio.</p>
          <a href={`https://instagram.com/${studio.instagram}`} target="_blank" rel="noreferrer" className="btn btn-rave mt-8">
            @{studio.instagram}
          </a>
        </div>
      </div>
    </section>
  )
}

function InfoAndFaq() {
  const studio = useStudio((s) => s.studio)
  const schedule = useStudio((s) => s.schedule)
  const days = [...schedule.weekdays]
    .sort((a, b) => a - b)
    .map((d) => WEEKDAYS[d])
    .join(' · ')

  return (
    <section className="mx-auto grid max-w-6xl gap-12 px-4 pt-24 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
      <div>
        <SectionTitle eyebrow="Estúdio" title="Onde estamos" align="left" />
        <ul className="mt-8 space-y-5 text-bone/85">
          <li className="flex gap-3">
            <MapPin className="mt-0.5 shrink-0 text-flame" size={20} />
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(`${studio.address}, ${studio.city}`)}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-bone"
            >
              {studio.address}
              <br />
              <span className="text-mute">{studio.city} · ver no mapa</span>
            </a>
          </li>
          <li className="flex gap-3">
            <Clock className="mt-0.5 shrink-0 text-flame" size={20} />
            <span>
              {days}
              <br />
              <span className="text-mute">
                {schedule.open} às {schedule.close} · com hora marcada
              </span>
            </span>
          </li>
        </ul>
      </div>
      <div>
        <SectionTitle eyebrow="Dúvidas" title="Antes de marcar" align="left" />
        <div className="mt-8 divide-y divide-bone/10 border-y border-bone/10">
          {FAQ.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {f.q}
                <span className="font-display text-2xl text-violet-light transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-mute">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <>
      <Hero />
      <StyleMarquee />
      <Specialties />
      <Artist />
      <Works />
      <HowItWorks />
      <OtherStyles />
      <Care />
      <InstagramCta />
      <InfoAndFaq />
    </>
  )
}
