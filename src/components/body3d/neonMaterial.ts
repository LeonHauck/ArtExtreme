import { Color, ShaderMaterial } from 'three'

/** Relógio compartilhado por todos os materiais (atualizado uma vez por frame). */
export const sharedTime = { value: 0 }

export interface NeonLook {
  base: string
  rimTop: string
  rimBottom: string
  /** Pulso de brilho (0 = parado, 1 = pulsando forte). */
  glow: number
}

/** Paleta dos estados de cada região do corpo. */
export const LOOKS = {
  idle: { base: '#3b3049', rimTop: '#be38f3', rimBottom: '#ff4fd8', glow: 0 },
  hover: { base: '#4d3f63', rimTop: '#e3a3ff', rimBottom: '#ff8a1f', glow: 0.25 },
  selected: { base: '#7a3a08', rimTop: '#ffd23f', rimBottom: '#ff8a1f', glow: 1 },
  disabled: { base: '#141217', rimTop: '#2e2a35', rimBottom: '#2e2a35', glow: 0 },
} satisfies Record<string, NeonLook>

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vY;

  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vY = world.y;
    vec4 mv = viewMatrix * world;
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uBase;
  uniform vec3 uRimTop;
  uniform vec3 uRimBottom;
  uniform float uGlow;

  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vY;

  void main() {
    vec3 n = normalize(vNormal);
    float ndv = clamp(dot(n, normalize(vViewDir)), 0.0, 1.0);

    // Contorno neon (fresnel) com gradiente vertical
    float fresnel = pow(1.0 - ndv, 2.3);
    vec3 rim = mix(uRimBottom, uRimTop, smoothstep(0.1, 1.7, vY));

    // Luz suave de cima/frente para dar volume à anatomia
    float key = clamp(dot(n, normalize(vec3(0.35, 0.8, 0.55))), 0.0, 1.0);
    vec3 col = uBase * (0.3 + 0.75 * key);
    col += rim * fresnel * 1.9;

    // Pulso da área selecionada
    col += rim * uGlow * (0.22 + 0.14 * sin(uTime * 3.2));

    // Faixa de "scanner" subindo pelo corpo
    float scanY = mod(uTime * 0.42, 2.6) - 0.35;
    float band = exp(-pow((vY - scanY) * 26.0, 2.0));
    col += rim * band * 0.6;

    // Linhas finas horizontais de holograma
    col *= 0.93 + 0.07 * step(0.5, fract(vY * 110.0));

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`

export function createNeonMaterial(look: NeonLook = LOOKS.idle) {
  return new ShaderMaterial({
    uniforms: {
      uTime: sharedTime,
      uBase: { value: new Color(look.base) },
      uRimTop: { value: new Color(look.rimTop) },
      uRimBottom: { value: new Color(look.rimBottom) },
      uGlow: { value: look.glow },
    },
    vertexShader,
    fragmentShader,
    toneMapped: false,
  })
}
