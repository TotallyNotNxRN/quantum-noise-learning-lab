"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { readThemeToken } from "@/lib/theme";

/** Full-screen GLSL fragment shader rendering layered fractal-noise ridges
 *  that read as flowing black oil. Pure GPU; no per-frame React work.
 *  Theme tokens are pushed in as uniforms whenever the user toggles theme. */
export function LiquidBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
      <Canvas
        gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
        orthographic
        camera={{ position: [0, 0, 1], zoom: 1, near: 0, far: 2 }}
      >
        <FullscreenQuad />
      </Canvas>
    </div>
  );
}

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

// fragment shader: fractal Brownian motion + ridge function. Produces curling
// black "oil" surface with thin highlight ridges in the accent color.
const FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uBg;
uniform vec3 uAccent;
uniform vec3 uAccent2;
uniform float uIntensity;

// ----- simplex noise (Ashima / Ian McEwan, public domain) -------------
vec3 mod289(vec3 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 =   v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute( permute( permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// fractal Brownian motion: octave sum of simplex noise
float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * snoise(p);
    p *= 2.02;
    a *= 0.5;
  }
  return v;
}

// ridge: |fbm| reflected — produces thin bright crease lines along the
// zero crossings of the noise field, which read as oil-surface highlights.
float ridge(vec3 p) {
  float n = fbm(p);
  return 1.0 - abs(n);
}

void main() {
  // Square the coords so noise isn't stretched on widescreens.
  vec2 uv = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);
  uv *= 1.4;

  float t = uTime * 0.06;

  // Two flowing layers at different speeds + directions for parallax.
  vec3 p1 = vec3(uv * 1.1 + vec2(t, -t * 0.6), t * 0.4);
  vec3 p2 = vec3(uv * 2.3 - vec2(t * 0.5, t * 0.8), -t * 0.3);

  float base = fbm(p1) * 0.55 + fbm(p2) * 0.35;
  float ridges = pow(ridge(p1 * 1.8 + vec3(0.0, t * 0.8, 0.0)), 4.5);

  // Body of the oil: very dark, slight self-shadowing.
  vec3 col = uBg + (uBg * 0.4) * (base * 0.6 + 0.5);

  // Thin amber highlights along the ridges.
  vec3 highlight = mix(uAccent2, uAccent, smoothstep(0.0, 1.0, base + 0.5));
  col += highlight * ridges * 0.55 * uIntensity;

  // Subtle vignette so the edges feel rolled into shadow.
  float vig = 1.0 - smoothstep(0.45, 1.05, length(uv));
  col *= 0.55 + 0.45 * vig;

  gl_FragColor = vec4(col, 1.0);
}
`;

function FullscreenQuad() {
  const matRef = useRef<THREE.ShaderMaterial | null>(null);
  const [, force] = useState(0);

  // Pull current theme palette as Three.js Color uniforms.
  const palette = usePalette();
  useEffect(() => {
    function refresh() {
      force((n) => n + 1);
    }
    document.addEventListener("qnl-theme-change", refresh);
    return () => document.removeEventListener("qnl-theme-change", refresh);
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uBg: { value: new THREE.Color(palette.bg) },
      uAccent: { value: new THREE.Color(palette.accent) },
      uAccent2: { value: new THREE.Color(palette.accent2) },
      uIntensity: { value: palette.intensity },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [palette.bg, palette.accent, palette.accent2, palette.intensity],
  );

  useFrame((state) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    const size = state.size;
    matRef.current.uniforms.uResolution.value.set(size.width, size.height);
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

function usePalette() {
  const [palette, setPalette] = useState(() => readPalette());
  useEffect(() => {
    setPalette(readPalette());
    const refresh = () => setPalette(readPalette());
    document.addEventListener("qnl-theme-change", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      document.removeEventListener("qnl-theme-change", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  return palette;
}

function readPalette() {
  const isLight = document.documentElement.getAttribute("data-theme") === "light";
  const bg = readThemeToken("--bg-deep") || (isLight ? "#f5f5f4" : "#050505");
  const accent = readThemeToken("--accent") || "#fbbf24";
  const accent2 = readThemeToken("--accent-2") || "#fb923c";
  return {
    bg: stripAlpha(bg),
    accent: stripAlpha(accent),
    accent2: stripAlpha(accent2),
    intensity: isLight ? 0.55 : 1.0,
  };
}

function stripAlpha(c: string): string {
  if (c.startsWith("#")) return c;
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (!m) return "#000000";
  const parts = m[1].split(",").map((s) => Math.round(parseFloat(s.trim())));
  return `rgb(${parts[0]}, ${parts[1]}, ${parts[2]})`;
}
