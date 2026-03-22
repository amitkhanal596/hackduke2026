"use client";

import { useEffect, useRef } from "react";

export default function OptimizedDotBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetMouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2); // Limit to 2x for performance
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    // Dot grid configuration
    const dotSpacing = 25;
    const maxDotSize = 2.5;
    const minDotSize = 0.8;
    const mouseInfluence = 180;
    const waveSpeed = 0.0008;
    const waveAmplitude = 1.2;

    // Color palette - emerald greens
    const greenShades = [
      "rgba(109, 212, 154, ", // #6dd49a
      "rgba(77, 184, 126, ",  // #4db87e
      "rgba(61, 154, 106, ",  // #3d9a6a
    ];

    let time = 0;
    let animationId: number;

    // Smooth mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      targetMouseRef.current.x = e.clientX;
      targetMouseRef.current.y = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Precompute dot positions
    const cols = Math.ceil(window.innerWidth / dotSpacing) + 1;
    const rows = Math.ceil(window.innerHeight / dotSpacing) + 1;
    const totalDots = cols * rows;

    // Animation loop with optimizations
    const animate = () => {
      // Smooth mouse lerp
      mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * 0.1;
      mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * 0.1;

      // Clear with transparency
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;

      // Draw dots
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const baseX = i * dotSpacing;
          const baseY = j * dotSpacing;

          // Wave effect based on position and time
          const distanceFromCenter = Math.sqrt(
            Math.pow(baseX - window.innerWidth / 2, 2) +
            Math.pow(baseY - window.innerHeight / 2, 2)
          );

          const wave1 = Math.sin(distanceFromCenter * 0.008 + time * 3) * waveAmplitude;
          const wave2 = Math.cos(baseX * 0.003 + time * 2) * 0.4;
          const wave3 = Math.sin(baseY * 0.003 + time * 2.5) * 0.4;

          const combinedWave = (wave1 + wave2 + wave3) / 3;

          // Mouse interaction - displacement
          const dx = baseX - mouseX;
          const dy = baseY - mouseY;
          const distanceFromMouse = Math.sqrt(dx * dx + dy * dy);
          const mouseEffect = Math.max(0, 1 - distanceFromMouse / mouseInfluence);

          // Displacement from mouse
          const displaceX = (dx / distanceFromMouse) * mouseEffect * 15;
          const displaceY = (dy / distanceFromMouse) * mouseEffect * 15;

          const x = baseX + (isNaN(displaceX) ? 0 : displaceX);
          const y = baseY + (isNaN(displaceY) ? 0 : displaceY);

          // Size variation
          const dotSize = minDotSize + (maxDotSize - minDotSize) * (0.5 + combinedWave * 0.5);
          const mouseSizeBoost = mouseEffect * 1.5;
          const finalSize = dotSize + mouseSizeBoost;

          // Opacity variation
          const baseOpacity = 0.25;
          const waveOpacity = (0.5 + combinedWave * 0.5) * 0.3;
          const mouseOpacity = mouseEffect * 0.4;
          const opacity = Math.min(0.8, baseOpacity + waveOpacity + mouseOpacity);

          // Color selection based on position
          const colorIndex = (i + j) % greenShades.length;
          const color = greenShades[colorIndex];

          // Draw dot
          ctx.fillStyle = `${color}${opacity})`;
          ctx.beginPath();
          ctx.arc(x, y, finalSize, 0, Math.PI * 2);
          ctx.fill();

          // Add connecting lines for nearby dots when mouse is near
          if (mouseEffect > 0.3) {
            // Check right neighbor
            if (i < cols - 1) {
              const nextX = (i + 1) * dotSpacing;
              const nextDx = nextX - mouseX;
              const nextDy = baseY - mouseY;
              const nextDist = Math.sqrt(nextDx * nextDx + nextDy * nextDy);
              const nextMouseEffect = Math.max(0, 1 - nextDist / mouseInfluence);

              if (nextMouseEffect > 0.3) {
                ctx.strokeStyle = `${color}${Math.min(mouseEffect, nextMouseEffect) * 0.3})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(nextX + (nextDx / nextDist) * nextMouseEffect * 15, baseY + (nextDy / nextDist) * nextMouseEffect * 15);
                ctx.stroke();
              }
            }

            // Check bottom neighbor
            if (j < rows - 1) {
              const nextY = (j + 1) * dotSpacing;
              const nextDx = baseX - mouseX;
              const nextDy = nextY - mouseY;
              const nextDist = Math.sqrt(nextDx * nextDx + nextDy * nextDy);
              const nextMouseEffect = Math.max(0, 1 - nextDist / mouseInfluence);

              if (nextMouseEffect > 0.3) {
                ctx.strokeStyle = `${color}${Math.min(mouseEffect, nextMouseEffect) * 0.3})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(baseX + (nextDx / nextDist) * nextMouseEffect * 15, nextY + (nextDy / nextDist) * nextMouseEffect * 15);
                ctx.stroke();
              }
            }
          }
        }
      }

      time += waveSpeed;
      animationId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.7 }}
    />
  );
}
