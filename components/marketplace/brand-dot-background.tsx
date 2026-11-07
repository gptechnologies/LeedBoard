"use client";

import { useEffect, useRef } from "react";
import styles from "./brand-dot-background.module.css";

const SPACING = 4;
const RADIUS = 0.7;
const FRAME_INTERVAL = 1000 / 30;
const OPACITY_STEPS = 32;

/** A fixed halftone grid: only the dots' opacity changes as waves pass. */
export function BrandDotBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let frame = 0;
    let previousTime = 0;
    let elapsed = 0;
    let visible = true;
    let dots: {
      x: number;
      y: number;
      phase: number;
      secondary: number;
      strength: number;
    }[] = [];

    function draw() {
      if (!context) return;
      context.clearRect(0, 0, width, height);
      // Batch circles by opacity rather than changing canvas state for every dot.
      const paths = Array.from({ length: OPACITY_STEPS }, () => new Path2D());
      for (const dot of dots) {
        const wave = (
          Math.sin(dot.phase - elapsed * 0.32) * 0.7 +
          Math.sin(dot.secondary + elapsed * 0.21) * 0.3 + 1
        ) / 2;
        const opacity = (0.06 + 0.32 * wave * wave) * dot.strength;
        const bucket = Math.min(
          OPACITY_STEPS - 1,
          Math.round(opacity * (OPACITY_STEPS - 1) / 0.38),
        );
        paths[bucket].moveTo(dot.x + RADIUS, dot.y);
        paths[bucket].arc(dot.x, dot.y, RADIUS, 0, Math.PI * 2);
      }
      for (let index = 0; index < paths.length; index++) {
        context.globalAlpha = index / (OPACITY_STEPS - 1) * 0.38;
        context.fill(paths[index]);
      }
      context.globalAlpha = 1;
    }

    function animate(time: number) {
      if (time - previousTime >= FRAME_INTERVAL) {
        elapsed += previousTime ? (time - previousTime) / 1000 : 0;
        previousTime = time;
        draw();
      }
      frame = requestAnimationFrame(animate);
    }

    function syncPlayback() {
      cancelAnimationFrame(frame);
      previousTime = 0;
      if (visible && !document.hidden && !reducedMotion.matches) {
        frame = requestAnimationFrame(animate);
      } else if (reducedMotion.matches) {
        elapsed = 0;
        draw();
      }
    }

    function resize() {
      if (!canvas || !context) return;
      ({ width, height } = canvas.getBoundingClientRect());
      const density = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * density);
      canvas.height = Math.round(height * density);
      context.setTransform(density, 0, 0, density, 0, 0);
      context.fillStyle = getComputedStyle(canvas).color;
      dots = [];
      for (let y = SPACING / 2; y < height; y += SPACING) {
        for (let x = SPACING / 2; x < width; x += SPACING) {
          dots.push({
            x,
            y,
            phase: x * 0.018 + y * 0.032 + Math.sin(x * 0.009) * 1.4,
            secondary: x * 0.011 - y * 0.025,
            // Give the centered wordmark a quieter area without a hard cutout.
            strength: 1 - 0.45 * Math.exp(-Math.pow((x - width / 2) / 100, 2)),
          });
        }
      }
      draw();
    }

    const resizeObserver = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncPlayback();
    });
    resize();
    resizeObserver.observe(canvas);
    intersectionObserver.observe(canvas);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", syncPlayback);
    reducedMotion.addEventListener("change", syncPlayback);
    syncPlayback();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", syncPlayback);
      reducedMotion.removeEventListener("change", syncPlayback);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.texture} aria-hidden="true" />;
}
