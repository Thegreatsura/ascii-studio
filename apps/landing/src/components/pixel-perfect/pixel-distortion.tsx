"use client";

/**
 * Move your cursor to smear the image pixels along a relaxing grid.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createAnimatedTexture } from "./animated-texture";

const PixelDistortion = ({
  image,
  className,
  dpr = 2,
  grid = 40,
  strength = 0.045,
  relax = 0.9,
  force = 70,
  brush = 0.125,
  maxPush = 8,
  momentum = 0.9,
  rgbShift = 0,
  pixelate = 0,
  wander = false,
  wanderSpeed = 1,
}: {
  image: string;
  className?: string;
  /** device pixel ratio cap — higher = sharper, heavier */
  dpr?: number;
  /** grid cells per axis — fewer = bigger "pixels" */
  grid?: number;
  /** how far smeared pixels travel */
  strength?: number;
  /** how quickly the grid settles back (higher = slower) */
  relax?: number;
  /** cursor push force */
  force?: number;
  /** brush radius as a fraction of the grid */
  brush?: number;
  /** clamp on per-cell push */
  maxPush?: number;
  /** cursor velocity carry-over */
  momentum?: number;
  /** chromatic aberration along the smear (0 = off) */
  rgbShift?: number;
  /** mosaic cell count (0 = off, else cells per axis) */
  pixelate?: number;
  /** autonomous ghost cursor that keeps the image swirling */
  wander?: boolean;
  /** ghost cursor speed multiplier */
  wanderSpeed?: number;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // live-updatable params (no remount)
  const strengthRef = useRef(strength);
  const relaxRef = useRef(relax);
  const forceRef = useRef(force);
  const brushRef = useRef(brush);
  const maxPushRef = useRef(maxPush);
  const momentumRef = useRef(momentum);
  const rgbShiftRef = useRef(rgbShift);
  const pixelateRef = useRef(pixelate);
  const wanderRef = useRef(wander);
  const wanderSpeedRef = useRef(wanderSpeed);

  useEffect(() => void (strengthRef.current = strength), [strength]);
  useEffect(() => void (relaxRef.current = relax), [relax]);
  useEffect(() => void (forceRef.current = force), [force]);
  useEffect(() => void (brushRef.current = brush), [brush]);
  useEffect(() => void (maxPushRef.current = maxPush), [maxPush]);
  useEffect(() => void (momentumRef.current = momentum), [momentum]);
  useEffect(() => void (rgbShiftRef.current = rgbShift), [rgbShift]);
  useEffect(() => void (pixelateRef.current = pixelate), [pixelate]);
  useEffect(() => void (wanderRef.current = wander), [wander]);
  useEffect(() => void (wanderSpeedRef.current = wanderSpeed), [wanderSpeed]);

  // grid + dpr + image require a rebuild of the GPU resources
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const GRID = Math.max(4, Math.round(grid));

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
      preserveDrawingBuffer: true, // allows PNG capture of the canvas
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, dpr));
    container.appendChild(renderer.domElement);
    const canvas = renderer.domElement;
    const onContextLost = (e: Event) => e.preventDefault();
    canvas.addEventListener("webglcontextlost", onContextLost);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -10, 10);
    camera.position.z = 1;

    const animated = createAnimatedTexture(image);

    const data = new Float32Array(GRID * GRID * 4);
    const dataTexture = new THREE.DataTexture(
      data,
      GRID,
      GRID,
      THREE.RGBAFormat,
      THREE.FloatType,
    );
    dataTexture.needsUpdate = true;

    const uniforms = {
      uTexture: { value: animated.texture },
      uDataTexture: { value: dataTexture },
      resolution: { value: new THREE.Vector4(1, 1, 1, 1) },
      uStrength: { value: strengthRef.current },
      uRgbShift: { value: rgbShiftRef.current },
      uPixelate: { value: pixelateRef.current },
    };

    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.ShaderMaterial({
        transparent: true,
        uniforms,
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform sampler2D uTexture;
          uniform sampler2D uDataTexture;
          uniform vec4 resolution;
          uniform float uStrength;
          uniform float uRgbShift;
          uniform float uPixelate;
          varying vec2 vUv;
          void main() {
            vec2 newUV = (vUv - 0.5) * resolution.zw + 0.5;
            // mosaic: quantise sampling into big square cells
            if (uPixelate > 1.0) {
              newUV = (floor(newUV * uPixelate) + 0.5) / uPixelate;
            }
            vec4 offset = texture2D(uDataTexture, vUv);
            vec2 disp = uStrength * offset.rg;
            if (uRgbShift > 0.0) {
              // chromatic split: each channel travels a different distance
              float r = texture2D(uTexture, newUV - disp * (1.0 + uRgbShift)).r;
              vec4 gSample = texture2D(uTexture, newUV - disp);
              float b = texture2D(uTexture, newUV - disp * (1.0 - uRgbShift)).b;
              gl_FragColor = vec4(r, gSample.g, b, gSample.a);
            } else {
              gl_FragColor = texture2D(uTexture, newUV - disp);
            }
          }
        `,
      }),
    );
    scene.add(mesh);

    let vw = 1;
    let vh = 1;
    const applyResolution = () => {
      const img = animated.texture.image as { width: number; height: number };
      const iw = img && img.width > 1 ? img.width : 1;
      const ih = img && img.height > 1 ? img.height : 1;
      const imageAspect = ih / iw;
      let a1 = 1;
      let a2 = 1;
      if (vh / vw > imageAspect) a1 = (vw / vh) * imageAspect;
      else a2 = vh / vw / imageAspect;
      uniforms.resolution.value.set(vw, vh, a1, a2);
    };

    const resize = () => {
      vw = container.clientWidth;
      vh = container.clientHeight;
      if (!vw || !vh) return;
      renderer.setSize(vw, vh);
      applyResolution();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const mouse = { x: 0.5, y: 0.5, px: 0.5, py: 0.5, vx: 0, vy: 0 };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      mouse.x = (e.clientX - r.left) / r.width;
      mouse.y = (e.clientY - r.top) / r.height;
      mouse.vx = mouse.x - mouse.px;
      mouse.vy = mouse.y - mouse.py;
      mouse.px = mouse.x;
      mouse.py = mouse.y;
    };
    canvas.addEventListener("pointermove", onMove);

    // autonomous "ghost cursor" that keeps the grid stirred without a mouse
    const ghost = { x: 0.5, y: 0.5, t: Math.random() * 100 };

    const applyBrush = (x: number, y: number, vx: number, vy: number) => {
      const radius = GRID * brushRef.current;
      const r2 = radius * radius;
      const forceValue = forceRef.current;
      const maxPushValue = maxPushRef.current;
      const gx = GRID * x;
      const gy = GRID * (1 - y);
      for (let i = 0; i < GRID; i++) {
        for (let j = 0; j < GRID; j++) {
          const dist = (gx - i) ** 2 + (gy - j) ** 2;
          if (dist < r2) {
            const idx = 4 * (i + GRID * j);
            const power = Math.min(radius / Math.sqrt(dist + 0.0001), maxPushValue);
            data[idx] += forceValue * vx * power;
            data[idx + 1] -= forceValue * vy * power;
          }
        }
      }
    };

    const updateGrid = (dt: number) => {
      const relaxValue = relaxRef.current;
      for (let i = 0; i < GRID * GRID; i++) {
        data[i * 4] *= relaxValue;
        data[i * 4 + 1] *= relaxValue;
      }

      applyBrush(mouse.x, mouse.y, mouse.vx, mouse.vy);
      mouse.vx *= momentumRef.current;
      mouse.vy *= momentumRef.current;

      if (wanderRef.current) {
        // layered sine orbit — never repeats visibly, stays inside the frame
        ghost.t += dt * wanderSpeedRef.current;
        const t = ghost.t;
        const nx =
          0.5 + 0.3 * Math.sin(t * 1.3) + 0.12 * Math.sin(t * 2.9 + 0.8);
        const ny =
          0.5 + 0.28 * Math.cos(t * 1.05) + 0.13 * Math.sin(t * 2.2 + 1.7);
        applyBrush(ghost.x, ghost.y, nx - ghost.x, ny - ghost.y);
        ghost.x = nx;
        ghost.y = ny;
      }

      dataTexture.needsUpdate = true;
    };

    let shaderTime = 0;
    let last = performance.now();
    const frame = () => {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      shaderTime += dt;
      uniforms.uStrength.value = strengthRef.current;
      uniforms.uRgbShift.value = rgbShiftRef.current;
      uniforms.uPixelate.value = pixelateRef.current;
      animated.update(shaderTime * 1000);
      applyResolution();
      updateGrid(dt);
      renderer.render(scene, camera);
    };

    let visible = true;
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        last = performance.now();
      },
      { rootMargin: "150px", threshold: 0 },
    );
    io.observe(container);

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (visible) frame();
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("pointermove", onMove);
      if (canvas.parentNode === container) container.removeChild(canvas);
      animated.dispose();
      dataTexture.dispose();
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      renderer.forceContextLoss();
      renderer.dispose();
    };
  }, [image, dpr, grid]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={className}
      style={{ overflow: "hidden" }}
    />
  );
};

export default PixelDistortion;
