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
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // live-updatable params (no remount)
  const strengthRef = useRef(strength);
  const relaxRef = useRef(relax);
  const forceRef = useRef(force);
  const brushRef = useRef(brush);
  const maxPushRef = useRef(maxPush);
  const momentumRef = useRef(momentum);

  useEffect(() => void (strengthRef.current = strength), [strength]);
  useEffect(() => void (relaxRef.current = relax), [relax]);
  useEffect(() => void (forceRef.current = force), [force]);
  useEffect(() => void (brushRef.current = brush), [brush]);
  useEffect(() => void (maxPushRef.current = maxPush), [maxPush]);
  useEffect(() => void (momentumRef.current = momentum), [momentum]);

  // grid + dpr + image require a rebuild of the GPU resources
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const GRID = Math.max(4, Math.round(grid));

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
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
          varying vec2 vUv;
          void main() {
            vec2 newUV = (vUv - 0.5) * resolution.zw + 0.5;
            vec4 offset = texture2D(uDataTexture, vUv);
            gl_FragColor = texture2D(uTexture, newUV - uStrength * offset.rg);
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

    const updateGrid = () => {
      const relaxValue = relaxRef.current;
      for (let i = 0; i < GRID * GRID; i++) {
        data[i * 4] *= relaxValue;
        data[i * 4 + 1] *= relaxValue;
      }
      const radius = GRID * brushRef.current;
      const r2 = radius * radius;
      const forceValue = forceRef.current;
      const maxPushValue = maxPushRef.current;
      const gx = GRID * mouse.x;
      const gy = GRID * (1 - mouse.y);
      for (let i = 0; i < GRID; i++) {
        for (let j = 0; j < GRID; j++) {
          const dist = (gx - i) ** 2 + (gy - j) ** 2;
          if (dist < r2) {
            const idx = 4 * (i + GRID * j);
            const power = Math.min(radius / Math.sqrt(dist + 0.0001), maxPushValue);
            data[idx] += forceValue * mouse.vx * power;
            data[idx + 1] -= forceValue * mouse.vy * power;
          }
        }
      }
      mouse.vx *= momentumRef.current;
      mouse.vy *= momentumRef.current;
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
      animated.update(shaderTime * 1000);
      applyResolution();
      updateGrid();
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
