"use client";

import { useEffect, useRef } from "react";

export default function EarthDotOverlay() {
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

    // Low-res Earth bitmap (32x16 pixels) - 1 = land, 0 = water
    // This is a simplified silhouette of Earth's continents
    const earthMap = [
      "00000000000000000000000000000000", // Row 0
      "00000000000000000000000000000000",
      "00001111100000111111100000000000", // North America, Europe
      "00011111110001111111110000000000",
      "00111111111111111111111100000000", // Europe, Asia
      "00111111111111111111111110000000",
      "00011111111111111111111111000000", // Asia
      "00001111111111111111111110000000",
      "00000111111111111111111100000000", // Africa, Asia
      "00000011111111111111111000000000",
      "00000001111111111111110000000000", // Africa
      "00000000111111111111100000011000", // Africa, Australia
      "00000000011111111111000000111100", // South America, Australia
      "00000000001111111110000000111000",
      "00000000000111111100000000000000",
      "00000000000000000000000000000000", // Row 15
    ];

    // Convert to 2D array for faster lookup
    const earthGrid: boolean[][] = earthMap.map(row =>
      row.split('').map(char => char === '1')
    );

    const EARTH_WIDTH = 32;
    const EARTH_HEIGHT = 16;
    const EARTH_SCALE = 15; // Size multiplier for the Earth
    const DOT_SPACING = 25;
    const BASE_DOT_SIZE = 1.5;
    const ENHANCED_DOT_SIZE = 3.5;
    const SPEED = 0.3; // Pixels per frame

    let earthX = -EARTH_WIDTH * EARTH_SCALE; // Start off-screen left
    const earthY = window.innerHeight / 2 - (EARTH_HEIGHT * EARTH_SCALE) / 2; // Vertically centered

    // Precompute dot grid
    const cols = Math.ceil(window.innerWidth / DOT_SPACING) + 1;
    const rows = Math.ceil(window.innerHeight / DOT_SPACING) + 1;

    let animationId: number;

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Move Earth across screen
      earthX += SPEED;

      // Reset when fully off-screen right
      if (earthX > window.innerWidth) {
        earthX = -EARTH_WIDTH * EARTH_SCALE;
      }

      // Draw dots with Earth overlay effect
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const dotX = i * DOT_SPACING;
          const dotY = j * DOT_SPACING;

          // Check if this dot is inside the Earth silhouette
          const relativeX = dotX - earthX;
          const relativeY = dotY - earthY;

          let isOnEarth = false;
          if (
            relativeX >= 0 &&
            relativeX < EARTH_WIDTH * EARTH_SCALE &&
            relativeY >= 0 &&
            relativeY < EARTH_HEIGHT * EARTH_SCALE
          ) {
            // Map to Earth grid coordinates
            const gridX = Math.floor(relativeX / EARTH_SCALE);
            const gridY = Math.floor(relativeY / EARTH_SCALE);

            if (
              gridX >= 0 &&
              gridX < EARTH_WIDTH &&
              gridY >= 0 &&
              gridY < EARTH_HEIGHT &&
              earthGrid[gridY][gridX]
            ) {
              isOnEarth = true;
            }
          }

          // Draw dot with enhanced brightness if on Earth
          if (isOnEarth) {
            const dotSize = ENHANCED_DOT_SIZE;
            const opacity = 0.9;
            const color = "rgba(109, 212, 154, "; // Emerald green

            // Draw enhanced dot
            ctx.fillStyle = `${color}${opacity})`;
            ctx.beginPath();
            ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
            ctx.fill();

            // Add glow effect
            ctx.fillStyle = `${color}${opacity * 0.3})`;
            ctx.beginPath();
            ctx.arc(dotX, dotY, dotSize * 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Draw normal subtle dot
            const dotSize = BASE_DOT_SIZE;
            const opacity = 0.15;
            const color = "rgba(109, 212, 154, ";

            ctx.fillStyle = `${color}${opacity})`;
            ctx.beginPath();
            ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

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
      style={{ opacity: 0.8 }}
    />
  );
}
