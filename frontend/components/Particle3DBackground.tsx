"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Particle3DBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Create particle torus
    const particleCount = 8000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    // Torus parameters
    const radius = 2;
    const tube = 0.8;

    // Color palette - emerald greens
    const color1 = new THREE.Color(0x6dd49a); // #6dd49a
    const color2 = new THREE.Color(0x4db87e);
    const color3 = new THREE.Color(0x3d9a6a);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Create torus shape using parametric equations
      const u = (Math.random() * Math.PI * 2);
      const v = (Math.random() * Math.PI * 2);

      const x = (radius + tube * Math.cos(v)) * Math.cos(u);
      const y = (radius + tube * Math.cos(v)) * Math.sin(u);
      const z = tube * Math.sin(v);

      // Add some randomness for organic feel
      const randomness = 0.15;
      positions[i3] = x + (Math.random() - 0.5) * randomness;
      positions[i3 + 1] = y + (Math.random() - 0.5) * randomness;
      positions[i3 + 2] = z + (Math.random() - 0.5) * randomness;

      // Color variation
      const colorChoice = Math.random();
      const selectedColor = colorChoice < 0.4 ? color1 : colorChoice < 0.7 ? color2 : color3;
      colors[i3] = selectedColor.r;
      colors[i3 + 1] = selectedColor.g;
      colors[i3 + 2] = selectedColor.b;

      // Random sizes
      sizes[i] = Math.random() * 2.5 + 1;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    // Custom shader material for glowing particles
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vDistance;
        uniform float uTime;
        uniform vec2 uMouse;

        void main() {
          vColor = color;

          vec3 pos = position;

          // Mouse interaction - repel particles
          vec2 mousePos = uMouse;
          vec2 particlePos = (modelViewMatrix * vec4(position, 1.0)).xy;
          float dist = distance(mousePos, particlePos);
          float pushStrength = smoothstep(2.0, 0.0, dist);
          vec2 pushDir = normalize(particlePos - mousePos);
          pos.xy += pushDir * pushStrength * 0.5;

          vDistance = dist;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vDistance;

        void main() {
          // Create circular particle
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);

          if (dist > 0.5) discard;

          // Soft glow
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          alpha *= 0.6;

          // Brighten on mouse hover
          float hoverGlow = smoothstep(2.0, 0.5, vDistance) * 0.4;
          alpha += hoverGlow;

          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Add subtle ambient particles in background
    const bgParticleCount = 200;
    const bgPositions = new Float32Array(bgParticleCount * 3);
    const bgSizes = new Float32Array(bgParticleCount);

    for (let i = 0; i < bgParticleCount; i++) {
      const i3 = i * 3;
      bgPositions[i3] = (Math.random() - 0.5) * 20;
      bgPositions[i3 + 1] = (Math.random() - 0.5) * 20;
      bgPositions[i3 + 2] = (Math.random() - 0.5) * 10;
      bgSizes[i] = Math.random() * 1.5 + 0.5;
    }

    const bgGeometry = new THREE.BufferGeometry();
    bgGeometry.setAttribute("position", new THREE.BufferAttribute(bgPositions, 3));
    bgGeometry.setAttribute("size", new THREE.BufferAttribute(bgSizes, 1));

    const bgMaterial = new THREE.PointsMaterial({
      color: 0x6dd49a,
      size: 1,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
    });

    const bgParticles = new THREE.Points(bgGeometry, bgMaterial);
    scene.add(bgParticles);

    // Mouse move handler
    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    // Animation loop
    let time = 0;
    const animate = () => {
      time += 0.005;

      // Rotate torus
      particles.rotation.x = time * 0.2;
      particles.rotation.y = time * 0.3;

      // Subtle background particle drift
      bgParticles.rotation.x = time * 0.05;
      bgParticles.rotation.y = time * 0.08;

      // Update mouse uniform
      (material as THREE.ShaderMaterial).uniforms.uMouse.value.set(
        mouseRef.current.x * 3,
        mouseRef.current.y * 3
      );
      (material as THREE.ShaderMaterial).uniforms.uTime.value = time;

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      containerRef.current?.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      bgGeometry.dispose();
      bgMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="fixed inset-0 pointer-events-none z-0" />;
}
