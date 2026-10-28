import { useCallback, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Grid, OrbitControls } from '@react-three/drei'
import { Spherical, Vector3, type Camera, type Mesh, type MeshBasicMaterial } from 'three'
import { RotateCcw } from 'lucide-react'
import { Mannequin } from './Mannequin'
import { sharedTime } from './neonMaterial'
import { ZONES } from './zones'

const TARGET = new Vector3(0, 0.9, 0)
const TARGET_ARR = TARGET.toArray()

const VIEWS = [
  { label: 'Frente', angle: 0 },
  { label: 'Esq.', angle: Math.PI / 2 },
  { label: 'Costas', angle: Math.PI },
  { label: 'Dir.', angle: -Math.PI / 2 },
] as const

/** Subconjunto da API do OrbitControls que usamos (evita depender dos tipos do three-stdlib). */
interface ControlsLike {
  target: Vector3
  update: () => void
  addEventListener: (type: 'start', fn: () => void) => void
  removeEventListener: (type: 'start', fn: () => void) => void
}

/** Gira a câmera suavemente até o ângulo pedido; cancela se o usuário arrastar. */
function CameraRig({ request }: { request: { angle: number; n: number } }) {
  const camera = useThree((s) => s.camera) as Camera
  const controls = useThree((s) => s.controls) as unknown as ControlsLike | null
  const animating = useRef(false)

  useEffect(() => {
    if (request.n > 0) animating.current = true
  }, [request])

  useEffect(() => {
    if (!controls) return
    const stop = () => {
      animating.current = false
    }
    controls.addEventListener('start', stop)
    return () => controls.removeEventListener('start', stop)
  }, [controls])

  useFrame((_, dt) => {
    if (!animating.current || !controls) return
    const offset = camera.position.clone().sub(controls.target)
    const sph = new Spherical().setFromVector3(offset)

    let diff = request.angle - sph.theta
    diff = Math.atan2(Math.sin(diff), Math.cos(diff)) // menor caminho
    const k = Math.min(1, dt * 7)
    sph.theta += diff * k
    sph.phi += (Math.PI / 2.15 - sph.phi) * k
    controls.target.lerp(TARGET, k)

    camera.position.copy(controls.target).add(new Vector3().setFromSpherical(sph))
    controls.update()
    if (Math.abs(diff) < 0.003) animating.current = false
  })

  return null
}

/** Avança o relógio compartilhado dos materiais neon (scanner e pulso). */
function TimeTicker() {
  useFrame(({ clock }) => {
    sharedTime.value = clock.elapsedTime
  })
  return null
}

/** Anel de pulso que se expande no chão, como luz de pista. */
function PulseRing() {
  const ref = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = (clock.elapsedTime * 0.5) % 1
    ref.current.scale.setScalar(0.6 + t * 1.1)
    ;(ref.current.material as MeshBasicMaterial).opacity = 0.55 * (1 - t)
  })
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
      <ringGeometry args={[0.49, 0.5, 96]} />
      <meshBasicMaterial color="#ff8a1f" transparent depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

function Stage() {
  return (
    <>
      <TimeTicker />
      {/* Piso em grade neon que some na distância */}
      <Grid
        position={[0, 0, 0]}
        infiniteGrid
        cellSize={0.2}
        cellThickness={0.6}
        cellColor="#3a1d52"
        sectionSize={1}
        sectionThickness={1.1}
        sectionColor="#be38f3"
        fadeDistance={7}
        fadeStrength={2}
      />
      {/* Pedestal: disco escuro + anéis roxo e laranja */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <circleGeometry args={[0.5, 96]} />
        <meshBasicMaterial color="#0d0a12" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[0.5, 0.515, 96]} />
        <meshBasicMaterial color="#d16bff" toneMapped={false} />
      </mesh>
      <PulseRing />
      <ContactShadows position={[0, 0.004, 0]} opacity={0.8} scale={1.6} blur={2.2} far={1} color="#000000" />
    </>
  )
}

interface BodyViewerProps {
  selectedZones: Set<string>
  selectedAreas: Set<string>
  enabledAreas: Set<string>
  onSelect: (zoneId: string) => void
}

export default function BodyViewer({ selectedZones, selectedAreas, enabledAreas, onSelect }: BodyViewerProps) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [view, setView] = useState({ angle: 0, n: 0 })
  const [activeView, setActiveView] = useState(0)

  const goTo = useCallback((angle: number, index: number) => {
    setView((v) => ({ angle, n: v.n + 1 }))
    setActiveView(index)
  }, [])

  const tooltip = hovered ? ZONES[hovered]?.label : null

  return (
    <div className="relative h-full w-full">
      {/* Brilho de fundo */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(190,56,243,0.22),transparent_55%),radial-gradient(ellipse_at_50%_95%,rgba(255,138,31,0.16),transparent_50%)]" />

      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 1.05, 3.7], fov: 34 }}
        gl={{ antialias: true, alpha: true }}
        onPointerMissed={() => setHovered(null)}
        aria-label="Corpo 3D: toque em uma região para escolher o local da tattoo"
      >
        <Stage />
        <Mannequin
          selectedZones={selectedZones}
          selectedAreas={selectedAreas}
          hovered={hovered}
          enabledAreas={enabledAreas}
          onHover={setHovered}
          onSelect={onSelect}
        />
        <OrbitControls
          makeDefault
          target={TARGET_ARR}
          enablePan={false}
          minDistance={1.4}
          maxDistance={4.2}
          minPolarAngle={0.18 * Math.PI}
          maxPolarAngle={0.82 * Math.PI}
          rotateSpeed={0.8}
        />
        <CameraRig request={view} />
      </Canvas>

      {/* Nome da região sob o cursor */}
      <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2">
        <span
          className={`rounded-full border border-bone/15 bg-ink/80 px-3 py-1 font-display text-sm tracking-widest text-bone uppercase backdrop-blur transition-opacity ${tooltip ? 'opacity-100' : 'opacity-0'}`}
        >
          {tooltip ?? '·'}
        </span>
      </div>

      {/* Atalhos de visão */}
      <div className="absolute inset-x-0 bottom-3 flex justify-center">
        <div className="flex items-center gap-1 rounded-full border border-bone/10 bg-ink/80 p-1 backdrop-blur">
          {VIEWS.map((v, i) => (
            <button
              key={v.label}
              type="button"
              onClick={() => goTo(v.angle, i)}
              className={`rounded-full px-3 py-1 font-display text-sm tracking-wider uppercase transition ${
                activeView === i ? 'bg-violet text-bone' : 'text-mute hover:text-bone'
              }`}
            >
              {v.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => goTo(0, 0)}
            className="rounded-full p-1.5 text-mute hover:text-bone"
            aria-label="Voltar à posição inicial"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
