"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/** Glossy liquid background — domain-warped FBM with smooth specular wave
 *  bands. Dark mode renders as polished black oil with bright white-grey
 *  highlights along the wave crests. Light mode inverts to a near-white
 *  cream oil with deep grey shadow bands. */
export function LiquidBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
      <Canvas
        gl={{ alpha: false, antialias: false, powerPreference: "high-performance" }}
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

// Pure grayscale glossy-liquid shader. Two stages:
//   1. Domain-warped FBM produces a smooth scalar `height` field with
//      flowing wave-like curves.
//   2. The local gradient of `height` against a fixed light direction
//      produces a specular highlight that traces the wave crests as
//      narrow bright ribbons -- exactly the oil-surface look in the
//      reference image.
const FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uResolution;
// uMode: 0.0 = dark (black oil + bright highlights),
//        1.0 = light (cream oil + dark shadow bands).
uniform float uMode;

// -------- 2D simplex noise (Ashima / Ian McEwan, public domain) -------
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise2(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                      -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0))
                   + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// FBM: 5 octaves of simplex noise.
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.55;
  mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    v += a * snoise2(p);
    p = rot * p * 2.05;
    a *= 0.55;
  }
  return v;
}

// Domain warp: warp the input position by another fbm before sampling
// fbm again -- gives the long curving liquid-like ridges instead of
// blobby turbulence.
float liquidHeight(vec2 p, float t) {
  vec2 q = vec2(fbm(p + vec2(0.0, t * 0.20)),
                fbm(p + vec2(5.2, 1.3) + vec2(t * 0.15, t * 0.08)));
  vec2 r = vec2(fbm(p + 4.0 * q + vec2(1.7, 9.2) + vec2(-t * 0.18, t * 0.10)),
                fbm(p + 4.0 * q + vec2(8.3, 2.8) + vec2(t * 0.12, -t * 0.07)));
  return fbm(p + 4.0 * r);
}

void main() {
  // Aspect-correct UVs centred on the screen.
  vec2 uv = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);
  uv *= 1.8;
  float t = uTime * 0.08;

  // Liquid scalar field.
  float h  = liquidHeight(uv, t);
  // Tiny step for analytic gradient -> specular highlight.
  float eps = 0.018;
  float hx = liquidHeight(uv + vec2(eps, 0.0), t);
  float hy = liquidHeight(uv + vec2(0.0, eps), t);
  vec2 grad = vec2(hx - h, hy - h) / eps;

  // Fake normal in [-1, 1]^2; the wave curls fake a 3D surface.
  vec3 N = normalize(vec3(-grad * 0.85, 1.0));
  // Light comes from upper-left, slightly out of screen.
  vec3 L = normalize(vec3(-0.45, 0.55, 0.85));
  float diff = clamp(dot(N, L), 0.0, 1.0);
  // Sharp specular for the glossy oil look.
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 H = normalize(L + V);
  float spec = pow(clamp(dot(N, H), 0.0, 1.0), 80.0);

  // Layered "height-tinted" base, slightly warmer in shadow valleys.
  float band = smoothstep(-0.6, 0.6, h);

  // ----- DARK MODE: deep black oil, bright cool-white highlights ------
  vec3 darkBase = mix(vec3(0.005), vec3(0.06), band);
  darkBase += vec3(0.04) * diff;            // soft ambient on facing slopes
  darkBase += vec3(0.95) * spec;            // narrow white specular ridges
  darkBase += vec3(0.18) * pow(diff, 3.0);  // gentle rim highlights

  // ----- LIGHT MODE: cream oil, dark shadow bands ---------------------
  vec3 lightBase = mix(vec3(0.97), vec3(0.82), band);
  lightBase -= vec3(0.18) * (1.0 - diff);
  lightBase += vec3(0.05) * spec;
  lightBase = clamp(lightBase, 0.0, 1.0);

  vec3 col = mix(darkBase, lightBase, uMode);

  // Vignette so the edges feel rolled into shadow / lighter haze.
  float vig = 1.0 - smoothstep(0.5, 1.3, length(uv * vec2(0.85, 1.0)));
  col *= mix(0.55 + 0.45 * vig, 0.85 + 0.15 * vig, uMode);

  gl_FragColor = vec4(col, 1.0);
}
`;

function FullscreenQuad() {
  const matRef = useRef<THREE.ShaderMaterial | null>(null);
  const mode = useThemeMode();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uMode: { value: mode },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (matRef.current) matRef.current.uniforms.uMode.value = mode;
  }, [mode]);

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

function useThemeMode(): number {
  const [mode, setMode] = useState<number>(0);
  useEffect(() => {
    function read() {
      const t = document.documentElement.getAttribute("data-theme");
      setMode(t === "light" ? 1 : 0);
    }
    read();
    document.addEventListener("qnl-theme-change", read);
    return () => document.removeEventListener("qnl-theme-change", read);
  }, []);
  return mode;
}

