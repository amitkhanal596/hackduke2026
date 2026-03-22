"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  trail: { x: number; y: number; opacity: number }[];
}

export default function ShootingStarsOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const STAR_COUNT = 8; // Number of simultaneous shooting stars
    const TRAIL_LENGTH = 12; // Number of trail points
    const STAR_SPEED_MIN = 8; // Minimum speed (pixels per frame)
    const STAR_SPEED_MAX = 15; // Maximum speed
    const SPAWN_INTERVAL = 80; // Frames between spawns (lower = more frequent)

    let stars: Star[] = [];
    let frameCount = 0;

    // Create a new shooting star
    const createStar = (): Star => {
      // Random edge spawn (top or left edges primarily)
      const edge = Math.random();
      let x: number, y: number, vx: number, vy: number;

      if (edge < 0.5) {
        // Spawn from top edge, moving down-right
        x = Math.random() * window.innerWidth;
        y = -10;
        vx = (Math.random() * 4 + 2) * (Math.random() > 0.3 ? 1 : -1); // Mostly right
        vy = Math.random() * (STAR_SPEED_MAX - STAR_SPEED_MIN) + STAR_SPEED_MIN;
      } else {
        // Spawn from left edge, moving right-down
        x = -10;
        y = Math.random() * window.innerHeight * 0.7; // Top 70% of screen
        vx = Math.random() * (STAR_SPEED_MAX - STAR_SPEED_MIN) + STAR_SPEED_MIN;
        vy = Math.random() * 6 + 3;
      }

      return {
        x,
        y,
        vx,
        vy,
        size: Math.random() * 2 + 1.5,
        opacity: Math.random() * 0.3 + 0.7,
        trail: []
      };
    };

    // Initialize with some stars
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push(createStar());
    }

    let animationId: number;

    const animate = () => {
      // Clear canvas with slight fade for trail effect
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      frameCount++;

      // Spawn new star periodically
      if (frameCount % SPAWN_INTERVAL === 0 && stars.length < STAR_COUNT * 2) {
        stars.push(createStar());
      }

      // Update and draw stars
      stars = stars.filter(star => {
        // Add current position to trail
        star.trail.push({ x: star.x, y: star.y, opacity: star.opacity });
        if (star.trail.length > TRAIL_LENGTH) {
          star.trail.shift();
        }

        // Update position
        star.x += star.vx;
        star.y += star.vy;

        // Remove if off-screen
        if (
          star.x > window.innerWidth + 20 ||
          star.y > window.innerHeight + 20 ||
          star.x < -20 ||
          star.y < -20
        ) {
          return false;
        }

        // Draw trail
        star.trail.forEach((point, i) => {
          const trailOpacity = (i / star.trail.length) * point.opacity * 0.5;
          const trailSize = star.size * (i / star.trail.length) * 0.8;

          // Trail dot
          ctx.fillStyle = `rgba(109, 212, 154, ${trailOpacity})`;
          ctx.beginPath();
          ctx.arc(point.x, point.y, trailSize, 0, Math.PI * 2);
          ctx.fill();

          // Trail glow
          if (i > star.trail.length * 0.5) {
            ctx.fillStyle = `rgba(109, 212, 154, ${trailOpacity * 0.3})`;
            ctx.beginPath();
            ctx.arc(point.x, point.y, trailSize * 2, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        // Draw main star (brightest)
        const gradient = ctx.createRadialGradient(
          star.x, star.y, 0,
          star.x, star.y, star.size * 3
        );
        gradient.addColorStop(0, `rgba(109, 212, 154, ${star.opacity})`);
        gradient.addColorStop(0.5, `rgba(109, 212, 154, ${star.opacity * 0.5})`);
        gradient.addColorStop(1, `rgba(109, 212, 154, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
        ctx.fill();

        // Core bright dot
        ctx.fillStyle = `rgba(200, 255, 220, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 0.8, 0, Math.PI * 2);
        ctx.fill();

        return true;
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1]"
      style={{ opacity: 0.9 }}
    />
  );
}
