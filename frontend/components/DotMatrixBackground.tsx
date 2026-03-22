"use client";

import { useEffect, useRef } from "react";

export default function DotMatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Dot matrix configuration
    const dotSpacing = 20;
    const maxDotSize = 3;
    const minDotSize = 0.5;
    const waveSpeed = 0.002;
    const waveAmplitude = 0.8;
    const greenShade = "rgba(109, 212, 154, "; // #6dd49a in rgba

    let time = 0;

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cols = Math.ceil(canvas.width / dotSpacing);
      const rows = Math.ceil(canvas.height / dotSpacing);

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * dotSpacing;
          const y = j * dotSpacing;

          // Create wave effect based on position and time
          const distanceFromCenter = Math.sqrt(
            Math.pow(x - canvas.width / 2, 2) + Math.pow(y - canvas.height / 2, 2)
          );

          const wave = Math.sin(distanceFromCenter * 0.01 + time) * waveAmplitude;
          const wave2 = Math.cos(x * 0.005 + time * 0.5) * 0.3;
          const wave3 = Math.sin(y * 0.005 + time * 0.7) * 0.3;

          // Combine waves for complex animation
          const combinedWave = (wave + wave2 + wave3) / 3;

          // Calculate dot size based on wave
          const dotSize = minDotSize + (maxDotSize - minDotSize) * (0.5 + combinedWave * 0.5);

          // Calculate opacity based on wave and position
          const baseOpacity = 0.15;
          const waveOpacity = (0.5 + combinedWave * 0.5) * 0.4;
          const opacity = Math.max(0.05, baseOpacity + waveOpacity);

          // Draw dot
          ctx.fillStyle = `${greenShade}${opacity})`;
          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fill();

          // Add occasional brighter dots for sparkle effect
          if (Math.random() > 0.998) {
            ctx.fillStyle = `${greenShade}0.6)`;
            ctx.beginPath();
            ctx.arc(x, y, dotSize * 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      time += waveSpeed;
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}
