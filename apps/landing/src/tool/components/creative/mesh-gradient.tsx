"use client";

import * as React from "react";
import * as THREE from "three";

import {
  ControlItem,
  ControlList,
  ControlSection,
  ControlSectionHeader,
  PanelTitle,
} from "@/tool/toolcraft/components/control-layout";
import { SliderControl } from "@/tool/toolcraft/components/controls/slider";
import { SwitchControl } from "@/tool/toolcraft/components/controls/boolean";
import { ColorValueControl } from "@/tool/toolcraft/components/controls/color/color-value-control";
import { Button } from "@/tool/toolcraft/components/primitives";

import {
  ToolCanvasShell,
  downloadCanvasPng,
} from "@/tool/components/creative/creative-common";

const DEFAULTS = {
  colorA: "#0b1026",
  colorB: "#3b5bdb",
  colorC: "#79a4ff",
  colorD: "#c8b6ff",
  noiseScale: 1.6,
  speed: 0.4,
  grain: 0.05,
  playing: true,
};

const VERT = /* glsl */ `
  void main() { gl_Position = vec4(position, 1.0); }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uNoiseScale;
  uniform float uGrain;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform vec3 uColorD;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float vnoise(vec2 p){
    vec2 i = floor(p); vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm(vec2 p){
    float s = 0.0; float a = 0.5;
    for (int i = 0; i < 5; i++){ s += a * vnoise(p); p *= 2.0; a *= 0.5; }
    return s;
  }

  void main(){
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    float asp = uResolution.x / uResolution.y;
    vec2 p = vec2(uv.x * asp, uv.y) * uNoiseScale;
    float t = uTime;
    float n1 = fbm(p + vec2(t * 0.3, t * 0.2));
    float n2 = fbm(p * 1.3 + vec2(-t * 0.2, t * 0.35) + 5.0);
    vec3 col = mix(uColorA, uColorB, smoothstep(0.15, 0.85, n1));
    col = mix(col, uColorC, smoothstep(0.3, 0.9, n2));
    col = mix(col, uColorD, smoothstep(0.35, 0.9, n1 * n2 * 1.6));
    float g = (hash(gl_FragCoord.xy + t) * 2.0 - 1.0) * uGrain;
    col += g;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function MeshGradient(): React.JSX.Element {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const rendererRef = React.useRef<THREE.WebGLRenderer | null>(null);
  const materialRef = React.useRef<THREE.ShaderMaterial | null>(null);
  const [params, setParams] = React.useState(DEFAULTS);
  const playingRef = React.useRef(params.playing);
  playingRef.current = params.playing;

  const set = <K extends keyof typeof DEFAULTS>(
    key: K,
    value: (typeof DEFAULTS)[K],
  ) => setParams((p) => ({ ...p, [key]: value }));

  // One-time renderer + animation setup.
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    const camera = new THREE.Camera();
    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uResolution: { value: new THREE.Vector2(1, 1) },
        uTime: { value: 0 },
        uNoiseScale: { value: DEFAULTS.noiseScale },
        uGrain: { value: DEFAULTS.grain },
        uColorA: { value: new THREE.Color(DEFAULTS.colorA) },
        uColorB: { value: new THREE.Color(DEFAULTS.colorB) },
        uColorC: { value: new THREE.Color(DEFAULTS.colorC) },
        uColorD: { value: new THREE.Color(DEFAULTS.colorD) },
      },
    });
    materialRef.current = material;
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

    const resize = () => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      renderer.setSize(w, h, false);
      material.uniforms.uResolution.value.set(
        renderer.domElement.width,
        renderer.domElement.height,
      );
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    let raf = 0;
    let time = 0;
    let last = performance.now();
    const loop = () => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      if (playingRef.current) time += dt * (materialRef.current?.userData.speed ?? 0.4);
      material.uniforms.uTime.value = time;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    material.userData.speed = DEFAULTS.speed;
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      material.dispose();
      if (renderer.domElement.parentNode === container)
        container.removeChild(renderer.domElement);
      rendererRef.current = null;
      materialRef.current = null;
    };
  }, []);

  // Push param changes to uniforms.
  React.useEffect(() => {
    const m = materialRef.current;
    if (!m) return;
    m.uniforms.uNoiseScale.value = params.noiseScale;
    m.uniforms.uGrain.value = params.grain;
    m.uniforms.uColorA.value.set(params.colorA);
    m.uniforms.uColorB.value.set(params.colorB);
    m.uniforms.uColorC.value.set(params.colorC);
    m.uniforms.uColorD.value.set(params.colorD);
    m.userData.speed = params.speed;
  }, [params]);

  const controls = (
    <>
      <ControlSection>
        <ControlSectionHeader>
          <PanelTitle>Colors</PanelTitle>
        </ControlSectionHeader>
        <ControlList>
          <ControlItem>
            <ColorValueControl
              label="Color 1"
              color={params.colorA}
              onColorChange={(v) => set("colorA", v)}
            />
          </ControlItem>
          <ControlItem>
            <ColorValueControl
              label="Color 2"
              color={params.colorB}
              onColorChange={(v) => set("colorB", v)}
            />
          </ControlItem>
          <ControlItem>
            <ColorValueControl
              label="Color 3"
              color={params.colorC}
              onColorChange={(v) => set("colorC", v)}
            />
          </ControlItem>
          <ControlItem>
            <ColorValueControl
              label="Color 4"
              color={params.colorD}
              onColorChange={(v) => set("colorD", v)}
            />
          </ControlItem>
        </ControlList>
      </ControlSection>

      <ControlSection>
        <ControlSectionHeader>
          <PanelTitle>Flow</PanelTitle>
        </ControlSectionHeader>
        <ControlList>
          <ControlItem>
            <SliderControl
              name="Noise scale"
              min={0.3}
              max={5}
              step={0.1}
              value={params.noiseScale}
              onValueChange={(v) => set("noiseScale", v)}
            />
          </ControlItem>
          <ControlItem>
            <SliderControl
              name="Flow speed"
              min={0}
              max={2}
              step={0.05}
              value={params.speed}
              onValueChange={(v) => set("speed", v)}
            />
          </ControlItem>
          <ControlItem>
            <SliderControl
              name="Grain"
              min={0}
              max={0.3}
              step={0.01}
              value={params.grain}
              onValueChange={(v) => set("grain", v)}
            />
          </ControlItem>
          <ControlItem>
            <SwitchControl
              name="Animate"
              checked={params.playing}
              onCheckedChange={(v) => set("playing", v)}
            />
          </ControlItem>
          <ControlItem>
            <Button
              className="w-full"
              size="sm"
              onClick={() => downloadCanvasPng(rendererRef.current?.domElement ?? null, "mesh-gradient")}
            >
              Export PNG
            </Button>
          </ControlItem>
        </ControlList>
      </ControlSection>
    </>
  );

  return (
    <ToolCanvasShell
      title="Mesh Gradient"
      onReset={() => setParams(DEFAULTS)}
      controls={controls}
    >
      <div ref={containerRef} className="h-full w-full" />
    </ToolCanvasShell>
  );
}
