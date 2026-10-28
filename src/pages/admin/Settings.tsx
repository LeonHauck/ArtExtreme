import { useRef, useState, type ReactNode } from 'react'
import { Download, KeyRound, Upload, X } from 'lucide-react'
import { useStudio } from '@/store/studio'
import { NumberField } from '@/components/ui/NumberField'
import { formatDateShort, onlyDigits, toISODate } from '@/lib/format'
import type { StudioInfo } from '@/types'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="font-display text-2xl tracking-wide">{title}</h2>
      {description && <p className="mt-1 text-sm text-mute">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}

const STUDIO_FIELDS: { key: keyof StudioInfo; label: string; placeholder?: string; hint?: string }[] = [
  { key: 'name', label: 'Nome do estúdio' },
  { key: 'artist', label: 'Tatuador' },
  { key: 'email', label: 'E-mail' },
  { key: 'whatsapp', label: 'WhatsApp (com DDI e DDD)', placeholder: '5511999999999', hint: 'Só números. Ex.: 55 + DDD + número.' },
  { key: 'instagram', label: 'Instagram', placeholder: 'artextreme' },
  { key: 'address', label: 'Endereço' },
  { key: 'city', label: 'Cidade / UF' },
]

function StudioPanel() {
  const studio = useStudio((s) => s.studio)
  const update = useStudio((s) => s.updateStudio)
  return (
    <Panel title="Estúdio" description="Aparece no site, no rodapé e nas mensagens de WhatsApp.">
      <div className="grid gap-4 sm:grid-cols-2">
        {STUDIO_FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="label">{f.label}</span>
            <input
              className="input"
              placeholder={f.placeholder}
              value={studio[f.key]}
              inputMode={f.key === 'whatsapp' ? 'numeric' : undefined}
              onChange={(e) => {
                let v = e.target.value
                if (f.key === 'whatsapp') v = onlyDigits(v)
                if (f.key === 'instagram') v = v.replace('@', '').trim()
                update({ [f.key]: v })
              }}
            />
            {f.hint && <span className="mt-1 block text-xs text-mute">{f.hint}</span>}
          </label>
        ))}
      </div>
    </Panel>
  )
}

function SchedulePanel() {
  const schedule = useStudio((s) => s.schedule)
  const update = useStudio((s) => s.updateSchedule)
  const [blockDate, setBlockDate] = useState('')

  const toggleDay = (d: number) =>
    update({
      weekdays: schedule.weekdays.includes(d) ? schedule.weekdays.filter((x) => x !== d) : [...schedule.weekdays, d],
    })

  const addBlocked = () => {
    if (!blockDate || schedule.blockedDates.includes(blockDate)) return
    update({ blockedDates: [...schedule.blockedDates, blockDate].sort() })
    setBlockDate('')
  }

  const today = toISODate(new Date())
  const upcomingBlocked = schedule.blockedDates.filter((d) => d >= today)

  return (
    <Panel title="Horários de atendimento" description="Define os dias e horários que o cliente pode escolher.">
      <span className="label">Dias de atendimento</span>
      <div className="flex flex-wrap gap-2">
        {WEEKDAYS.map((w, d) => (
          <button key={w} type="button" className="chip" data-active={schedule.weekdays.includes(d)} onClick={() => toggleDay(d)}>
            {w}
          </button>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <label className="block">
          <span className="label">Abre</span>
          <input type="time" className="input" value={schedule.open} onChange={(e) => e.target.value && update({ open: e.target.value })} />
        </label>
        <label className="block">
          <span className="label">Fecha</span>
          <input type="time" className="input" value={schedule.close} onChange={(e) => e.target.value && update({ close: e.target.value })} />
        </label>
        <label className="block">
          <span className="label">Intervalo</span>
          <select
            className="input"
            value={schedule.stepMinutes}
            onChange={(e) => update({ stepMinutes: Number(e.target.value) })}
          >
            {[30, 60, 90, 120].map((m) => (
              <option key={m} value={m}>
                {m} min
              </option>
            ))}
          </select>
        </label>
        <div>
          <span className="label">Agenda aberta</span>
          <NumberField value={schedule.daysAhead} min={7} max={365} suffix="dias" onCommit={(daysAhead) => update({ daysAhead })} />
        </div>
      </div>

      <div className="mt-6">
        <span className="label">Folgas e datas bloqueadas</span>
        <div className="flex gap-2">
          <input type="date" className="input max-w-52" min={today} value={blockDate} onChange={(e) => setBlockDate(e.target.value)} />
          <button type="button" className="btn btn-outline btn-sm" onClick={addBlocked} disabled={!blockDate}>
            Bloquear
          </button>
        </div>
        {upcomingBlocked.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {upcomingBlocked.map((d) => (
              <span key={d} className="inline-flex items-center gap-1 rounded-full border border-violet/40 bg-violet/10 py-1 pr-1 pl-3 text-sm">
                {formatDateShort(d)}
                <button
                  type="button"
                  aria-label={`Desbloquear ${d}`}
                  className="rounded-full p-1 text-mute hover:text-bone"
                  onClick={() => update({ blockedDates: schedule.blockedDates.filter((x) => x !== d) })}
                >
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </Panel>
  )
}

function SecurityPanel() {
  const setPin = useStudio((s) => s.setAdminPin)
  const [pin, setPinValue] = useState('')
  const [saved, setSaved] = useState(false)

  return (
    <Panel title="PIN de acesso" description="Usado para entrar no painel neste aparelho.">
      <div className="flex gap-2">
        <input
          type="password"
          inputMode="numeric"
          maxLength={8}
          placeholder="Novo PIN (4 a 8 dígitos)"
          className="input max-w-64"
          value={pin}
          onChange={(e) => {
            setPinValue(onlyDigits(e.target.value))
            setSaved(false)
          }}
        />
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={pin.length < 4}
          onClick={() => {
            setPin(pin)
            setPinValue('')
            setSaved(true)
          }}
        >
          <KeyRound size={15} /> Salvar
        </button>
      </div>
      {saved && <p className="mt-2 text-sm text-emerald-400">PIN atualizado.</p>}
    </Panel>
  )
}

function BackupPanel() {
  const exportData = useStudio((s) => s.exportData)
  const importData = useStudio((s) => s.importData)
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const download = () => {
    const blob = new Blob([exportData()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `artextreme-backup-${toISODate(new Date())}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const upload = async (file: File) => {
    try {
      importData(await file.text())
      setMsg({ ok: true, text: 'Backup restaurado com sucesso.' })
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Não foi possível ler o arquivo.' })
    }
  }

  return (
    <Panel
      title="Backup"
      description="Os dados ficam salvos neste aparelho. Baixe um backup de tempos em tempos ou para levar a outro aparelho."
    >
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-outline btn-sm" onClick={download}>
          <Download size={15} /> Baixar backup
        </button>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()}>
          <Upload size={15} /> Restaurar backup
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f && confirm('Restaurar este backup? Os dados atuais serão substituídos.')) upload(f)
            e.target.value = ''
          }}
        />
      </div>
      {msg && <p className={`mt-3 text-sm ${msg.ok ? 'text-emerald-400' : 'text-violet-light'}`}>{msg.text}</p>}
    </Panel>
  )
}

export default function Settings() {
  return (
    <div className="animate-fade-up space-y-6">
      <h1 className="font-display text-4xl tracking-wide">Configurações</h1>
      <StudioPanel />
      <SchedulePanel />
      <div className="grid gap-6 lg:grid-cols-2">
        <SecurityPanel />
        <BackupPanel />
      </div>
    </div>
  )
}
