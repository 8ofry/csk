"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
  hue: number;
  // Turbulence phase offsets for organic movement
  phaseX: number;
  phaseY: number;
  phaseSpeed: number;
}

export function GoldParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Mouse position in ref to avoid re-renders
  const mouse = useRef({ x: -9999, y: -9999, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let time = 0;
    const particles: Particle[] = [];

    // ── Resize ─────────────────────────────────────────────
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // ── Mouse tracking ──────────────────────────────────────
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current.x = e.clientX - rect.left;
      mouse.current.y = e.clientY - rect.top;
      mouse.current.active = true;
    };
    const onMouseLeave = () => { mouse.current.active = false; };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);

    // Touch support for mobile
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      const rect = canvas.getBoundingClientRect();
      mouse.current.x = t.clientX - rect.left;
      mouse.current.y = t.clientY - rect.top;
      mouse.current.active = true;
    };
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    // ── Spawn helper ────────────────────────────────────────
    const spawnParticle = (): Particle => {
      const zone = Math.random();
      let x: number, y: number;

      if (zone < 0.35) {
        // Radial burst from center-ish
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * canvas.width * 0.18;
        x = canvas.width / 2 + Math.cos(angle) * r;
        y = canvas.height * 0.44 + Math.sin(angle) * r;
      } else if (zone < 0.65) {
        // Spread across width, mid-height
        x = Math.random() * canvas.width;
        y = canvas.height * 0.2 + Math.random() * canvas.height * 0.6;
      } else {
        // Random edges
        const edge = Math.floor(Math.random() * 4);
        x = edge === 0 ? 0 : edge === 1 ? canvas.width : Math.random() * canvas.width;
        y = edge === 2 ? 0 : edge === 3 ? canvas.height : Math.random() * canvas.height;
      }

      const angle = Math.random() * Math.PI * 2;
      const speed = 0.15 + Math.random() * 0.9;
      const maxLife = 90 + Math.random() * 200;

      return {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.1,
        size: 0.6 + Math.random() * 2.2,
        opacity: 0,
        life: 0,
        maxLife,
        hue: 38 + Math.random() * 22,
        // Each particle gets unique turbulence phase so they don't all wave in sync
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        phaseSpeed: 0.008 + Math.random() * 0.018,
      };
    };

    // Pre-fill with staggered start times
    for (let i = 0; i < 140; i++) {
      const p = spawnParticle();
      p.life = Math.random() * p.maxLife;
      particles.push(p);
    }

    // ── Simple Perlin-like noise via sine harmonics ─────────
    // Returns a value roughly in [-1, 1]
    const noiseX = (x: number, y: number, t: number) =>
      Math.sin(x * 0.004 + t * 0.7) * 0.6 +
      Math.sin(y * 0.006 - t * 0.5) * 0.4;

    const noiseY = (x: number, y: number, t: number) =>
      Math.cos(y * 0.005 + t * 0.6) * 0.6 +
      Math.cos(x * 0.003 - t * 0.8) * 0.4;

    // ── Draw loop ───────────────────────────────────────────
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.012;

      while (particles.length < 170) particles.push(spawnParticle());

      const mx = mouse.current.x;
      const my = mouse.current.y;
      const mouseActive = mouse.current.active;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (!p) continue;

        p.life++;

        // ── Turbulence force (flow-field) ───────────────────
        const turbStr = 0.018;
        const tx = noiseX(p.x, p.y, time + p.phaseX) * turbStr;
        const ty = noiseY(p.x, p.y, time + p.phaseY) * turbStr;

        // ── Cursor repulsion / attraction ───────────────────
        let cursorFx = 0;
        let cursorFy = 0;
        if (mouseActive) {
          const dx = p.x - mx;
          const dy = p.y - my;
          const distSq = dx * dx + dy * dy;
          const influence = 18000; // radius² at which cursor has full effect
          if (distSq < influence * 1.8) {
            const dist = Math.sqrt(distSq) + 0.1;
            // Close → strong repulsion; far → gentle attraction spiral
            const strength = dist < 120
              ? 1.8 / dist          // repel hard up-close
              : -0.25 / dist;       // gently pull from far
            cursorFx = (dx / dist) * strength;
            cursorFy = (dy / dist) * strength;
          }
        }

        // Apply forces + gentle drag
        p.vx = (p.vx + tx + cursorFx) * 0.985;
        p.vy = (p.vy + ty + cursorFy - 0.003) * 0.985; // -0.003 = upward buoyancy
        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges softly
        if (p.x < -20) p.x = canvas.width + 20;
        if (p.x > canvas.width + 20) p.x = -20;
        if (p.y < -20) p.y = canvas.height + 20;
        if (p.y > canvas.height + 20) p.y = -20;

        // Opacity lifecycle
        const progress = p.life / p.maxLife;
        if (progress < 0.15) {
          p.opacity = progress / 0.15;
        } else if (progress < 0.8) {
          p.opacity = 1;
        } else {
          p.opacity = 1 - (progress - 0.8) / 0.2;
        }

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        // Boost brightness near cursor
        let brightnessBoost = 0;
        if (mouseActive) {
          const dx = p.x - mx;
          const dy = p.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          brightnessBoost = Math.max(0, 1 - dist / 180) * 35;
        }

        // Draw glow halo
        const glowSize = p.size * (4 + brightnessBoost * 0.05);
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
        const alpha1 = p.opacity * (0.85 + brightnessBoost * 0.004);
        const alpha2 = p.opacity * (0.35 + brightnessBoost * 0.003);
        grd.addColorStop(0, `hsla(${p.hue}, 95%, ${70 + brightnessBoost}%, ${alpha1})`);
        grd.addColorStop(0.4, `hsla(${p.hue}, 85%, 55%, ${alpha2})`);
        grd.addColorStop(1, `hsla(${p.hue}, 70%, 40%, 0)`);

        ctx.beginPath();
        ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Core bright dot — gets bigger near cursor
        const coreSize = p.size * (1 + brightnessBoost * 0.03);
        ctx.beginPath();
        ctx.arc(p.x, p.y, coreSize, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 100%, ${85 + brightnessBoost * 0.3}%, ${p.opacity})`;
        ctx.fill();
      }

      // ── Cursor burst ring ───────────────────────────────
      if (mouseActive) {
        const ringGrd = ctx.createRadialGradient(mx, my, 0, mx, my, 90);
        ringGrd.addColorStop(0, "hsla(45, 100%, 70%, 0.08)");
        ringGrd.addColorStop(0.5, "hsla(45, 90%, 55%, 0.04)");
        ringGrd.addColorStop(1, "hsla(45, 80%, 40%, 0)");
        ctx.beginPath();
        ctx.arc(mx, my, 90, 0, Math.PI * 2);
        ctx.fillStyle = ringGrd;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-[1]"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
