import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { Color, LatheGeometry, Vector2 } from 'three'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { ZONES } from './zones'
import { createNeonMaterial, LOOKS, type NeonLook } from './neonMaterial'

interface BodyCtxValue {
  /** Zonas marcadas no 3D. */
  selectedZones: Set<string>
  /** Áreas marcadas pela lista (acendem todas as zonas daquela área). */
  selectedAreas: Set<string>
  hovered: string | null
  enabledAreas: Set<string>
  setHovered: (zone: string | null) => void
  onSelect: (zone: string) => void
}

const BodyCtx = createContext<BodyCtxValue | null>(null)

type Vec3 = [number, number, number]
type Profile = [number, number][]

interface PartProps {
  zone: string
  position?: Vec3
  rotation?: Vec3
  scale?: Vec3
  children: ReactNode
}

/**
 * Uma região clicável do corpo. `children` é a geometria.
 * A cor transita suavemente entre os estados (normal, hover, selecionado).
 */
function Part({ zone, children, ...transform }: PartProps) {
  const ctx = useContext(BodyCtx)!
  const areaId = ZONES[zone].areaId
  const enabled = ctx.enabledAreas.has(areaId)
  const selected = enabled && (ctx.selectedZones.has(zone) || ctx.selectedAreas.has(areaId))
  const hovered = enabled && ctx.hovered === zone

  const look: NeonLook = !enabled ? LOOKS.disabled : selected ? LOOKS.selected : hovered ? LOOKS.hover : LOOKS.idle

  const material = useMemo(() => createNeonMaterial(look), []) // eslint-disable-line react-hooks/exhaustive-deps
  const target = useRef({ base: new Color(), rimTop: new Color(), rimBottom: new Color(), glow: 0 })

  useEffect(() => {
    target.current.base.set(look.base)
    target.current.rimTop.set(look.rimTop)
    target.current.rimBottom.set(look.rimBottom)
    target.current.glow = look.glow
  }, [look])

  useEffect(() => () => material.dispose(), [material])

  useFrame((_, dt) => {
    const k = Math.min(1, dt * 10)
    const u = material.uniforms
    u.uBase.value.lerp(target.current.base, k)
    u.uRimTop.value.lerp(target.current.rimTop, k)
    u.uRimBottom.value.lerp(target.current.rimBottom, k)
    u.uGlow.value += (target.current.glow - u.uGlow.value) * k
  })

  const handleOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    ctx.setHovered(zone)
    document.body.style.cursor = enabled ? 'pointer' : 'not-allowed'
  }
  const handleOut = () => {
    ctx.setHovered(null)
    document.body.style.cursor = ''
  }
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    // Ignora "cliques" que na verdade foram arrastes para girar o boneco
    if (e.delta > 6 || !enabled) return
    ctx.onSelect(zone)
  }

  return (
    <mesh {...transform} material={material} onPointerOver={handleOver} onPointerOut={handleOut} onClick={handleClick}>
      {children}
    </mesh>
  )
}

/** Perfil (raio, altura) girado em torno do eixo Y, cobrindo o arco [phiStart, phiStart+phiLength]. */
function Lathe({ profile, phiStart = 0, phiLength = Math.PI * 2, segments = 32 }: {
  profile: Profile
  phiStart?: number
  phiLength?: number
  segments?: number
}) {
  const geometry = useMemo(
    () => new LatheGeometry(profile.map(([r, y]) => new Vector2(r, y)), segments, phiStart, phiLength),
    [profile, phiStart, phiLength, segments],
  )
  useEffect(() => () => geometry.dispose(), [geometry])
  return <primitive object={geometry} attach="geometry" />
}

const PI = Math.PI

/* ─── Silhuetas: [raio, altura], de baixo para cima ─── */

const HEAD: Profile = [
  [0.001, 1.6], [0.04, 1.605], [0.062, 1.625], [0.078, 1.66], [0.09, 1.7], [0.097, 1.745],
  [0.096, 1.785], [0.085, 1.82], [0.06, 1.85], [0.03, 1.866], [0.001, 1.87],
]
const NECK: Profile = [[0.054, 1.46], [0.05, 1.52], [0.046, 1.57], [0.05, 1.64]]

/** Tronco superior: cintura → peito → ombros (formato em V). */
const UPPER_TORSO: Profile = [
  [0.128, 1.13], [0.135, 1.18], [0.148, 1.24], [0.162, 1.3], [0.173, 1.36], [0.181, 1.41],
  [0.178, 1.45], [0.16, 1.485], [0.12, 1.51], [0.06, 1.525], [0.001, 1.53],
]
/** Tronco inferior: quadril → cintura. */
const LOWER_TORSO: Profile = [
  [0.001, 0.84], [0.06, 0.845], [0.115, 0.865], [0.148, 0.91], [0.158, 0.96], [0.152, 1.01],
  [0.138, 1.07], [0.128, 1.13],
]
const TORSO_SCALE: Vec3 = [1, 1, 0.63]

/* Membros: perfis relativos à articulação de cima (y = 0), descendo */
const UPPER_ARM: Profile = [
  [0.001, -0.31], [0.03, -0.305], [0.038, -0.29], [0.04, -0.26], [0.044, -0.2], [0.05, -0.13],
  [0.054, -0.07], [0.052, -0.02], [0.04, 0.01], [0.001, 0.02],
]
const FOREARM: Profile = [
  [0.001, -0.27], [0.025, -0.265], [0.027, -0.25], [0.03, -0.21], [0.037, -0.14], [0.043, -0.08],
  [0.044, -0.04], [0.04, -0.005], [0.03, 0.015], [0.001, 0.02],
]
const THIGH: Profile = [
  [0.001, -0.45], [0.042, -0.445], [0.05, -0.43], [0.054, -0.39], [0.062, -0.3], [0.074, -0.2],
  [0.084, -0.1], [0.088, -0.03], [0.075, 0.02], [0.001, 0.04],
]
const CALF: Profile = [
  [0.001, -0.41], [0.028, -0.405], [0.03, -0.39], [0.032, -0.33], [0.04, -0.25], [0.052, -0.16],
  [0.056, -0.1], [0.05, -0.04], [0.046, 0], [0.035, 0.015], [0.001, 0.025],
]

function Torso() {
  return (
    <>
      {/* Superior: peito (frente), costelas (laterais), costas (trás) */}
      <Part zone="peito" scale={TORSO_SCALE}>
        <Lathe profile={UPPER_TORSO} phiStart={-0.3 * PI} phiLength={0.6 * PI} />
      </Part>
      <Part zone="costela_e" scale={TORSO_SCALE}>
        <Lathe profile={UPPER_TORSO} phiStart={0.3 * PI} phiLength={0.4 * PI} />
      </Part>
      <Part zone="costas" scale={TORSO_SCALE}>
        <Lathe profile={UPPER_TORSO} phiStart={0.7 * PI} phiLength={0.6 * PI} />
      </Part>
      <Part zone="costela_d" scale={TORSO_SCALE}>
        <Lathe profile={UPPER_TORSO} phiStart={1.3 * PI} phiLength={0.4 * PI} />
      </Part>
      {/* Inferior: abdômen (frente) e lombar (trás) */}
      <Part zone="abdomen" scale={TORSO_SCALE}>
        <Lathe profile={LOWER_TORSO} phiStart={-0.5 * PI} phiLength={PI} />
      </Part>
      <Part zone="lombar" scale={TORSO_SCALE}>
        <Lathe profile={LOWER_TORSO} phiStart={0.5 * PI} phiLength={PI} />
      </Part>
    </>
  )
}


/** Metades de um membro: frente (+Z, voltada para a câmera) e trás. */
const FRONT = { phiStart: -PI / 2, phiLength: PI }
const BACK = { phiStart: PI / 2, phiLength: PI }

/** Braço em "A-pose", na posição anatômica (palmas para a frente). side = 1 (esquerdo, +X) ou -1 (direito, -X). */
function Arm({ side }: { side: 1 | -1 }) {
  const s = side === 1 ? 'e' : 'd'
  return (
    <group position={[0.212 * side, 1.43, 0]} rotation={[0, 0, 0.16 * side]}>
      {/* Deltoide */}
      <Part zone={`ombro_${s}`} scale={[1, 1.08, 0.92]}>
        <sphereGeometry args={[0.068, 32, 20]} />
      </Part>
      {/* Braço: bíceps (frente) e tríceps (trás) */}
      <Part zone={`biceps_${s}`} scale={[1, 1, 0.95]}>
        <Lathe profile={UPPER_ARM} {...FRONT} />
      </Part>
      <Part zone={`triceps_${s}`} scale={[1, 1, 0.95]}>
        <Lathe profile={UPPER_ARM} {...BACK} />
      </Part>
      <group position={[0, -0.3, 0]} rotation={[-0.1, 0, 0]}>
        {/* Antebraço: interno (frente, com a palma para a frente) e externo (trás) */}
        <Part zone={`antebraco_int_${s}`} scale={[1, 1, 0.82]}>
          <Lathe profile={FOREARM} {...FRONT} />
        </Part>
        <Part zone={`antebraco_ext_${s}`} scale={[1, 1, 0.82]}>
          <Lathe profile={FOREARM} {...BACK} />
        </Part>
        {/* Mão: palma para a frente, polegar para fora */}
        <group position={[0, -0.27, 0]}>
          <Part zone={`mao_${s}`} position={[0, -0.055, 0]} scale={[0.042, 0.062, 0.021]}>
            <sphereGeometry args={[1, 24, 16]} />
          </Part>
          <Part zone={`mao_${s}`} position={[0, -0.12, 0.003]} scale={[0.036, 0.05, 0.017]}>
            <sphereGeometry args={[1, 20, 14]} />
          </Part>
          <Part zone={`mao_${s}`} position={[0.042 * side, -0.05, 0.006]} rotation={[0, 0, 0.5 * side]}>
            <capsuleGeometry args={[0.011, 0.04, 6, 12]} />
          </Part>
        </group>
      </group>
    </group>
  )
}

function Leg({ side }: { side: 1 | -1 }) {
  const s = side === 1 ? 'e' : 'd'
  return (
    <group position={[0.093 * side, 0.92, 0]} rotation={[0, 0, 0.028 * side]}>
      {/* Coxa: frente e posterior */}
      <Part zone={`coxa_${s}`}>
        <Lathe profile={THIGH} {...FRONT} />
      </Part>
      <Part zone={`posterior_${s}`}>
        <Lathe profile={THIGH} {...BACK} />
      </Part>
      <group position={[0, -0.44, 0]}>
        {/* Perna: canela (frente) e panturrilha (trás) */}
        <Part zone={`canela_${s}`} position={[0, 0, -0.006]} scale={[1, 1, 1.05]}>
          <Lathe profile={CALF} {...FRONT} />
        </Part>
        <Part zone={`panturrilha_${s}`} position={[0, 0, -0.006]} scale={[1, 1, 1.05]}>
          <Lathe profile={CALF} {...BACK} />
        </Part>
        {/* Pé: cápsula deitada e achatada */}
        <Part zone={`pe_${s}`} position={[0, -0.445, 0.045]} rotation={[PI / 2, 0, 0]} scale={[1.05, 1, 0.7]}>
          <capsuleGeometry args={[0.038, 0.15, 8, 18]} />
        </Part>
      </group>
    </group>
  )
}

interface MannequinProps {
  selectedZones: Set<string>
  selectedAreas: Set<string>
  hovered: string | null
  enabledAreas: Set<string>
  onHover: (zone: string | null) => void
  onSelect: (zone: string) => void
}

export function Mannequin({ selectedZones, selectedAreas, hovered, enabledAreas, onHover, onSelect }: MannequinProps) {
  const ctx = useMemo<BodyCtxValue>(
    () => ({ selectedZones, selectedAreas, hovered, enabledAreas, setHovered: onHover, onSelect }),
    [selectedZones, selectedAreas, hovered, enabledAreas, onHover, onSelect],
  )

  return (
    <BodyCtx.Provider value={ctx}>
      <group>
        <Part zone="cabeca" position={[0, 0, 0.008]} scale={[1, 1, 1.1]}>
          <Lathe profile={HEAD} />
        </Part>
        {/* Pescoço (frente) e nuca (trás) */}
        <Part zone="pescoco" scale={[1, 1, 0.95]}>
          <Lathe profile={NECK} {...FRONT} />
        </Part>
        <Part zone="nuca" scale={[1, 1, 0.95]}>
          <Lathe profile={NECK} {...BACK} />
        </Part>
        <Torso />
        <Arm side={1} />
        <Arm side={-1} />
        <Leg side={1} />
        <Leg side={-1} />
      </group>
    </BodyCtx.Provider>
  )
}
