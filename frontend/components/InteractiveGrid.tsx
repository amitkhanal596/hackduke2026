"use client";

import { useEffect, useRef, useState } from 'react'

interface Dot {
  x: number
  y: number
  baseX: number
  baseY: number
  vx: number
  vy: number
}

export function InteractiveGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    let dots: Dot[] = []
    const gridSize = 40
    const maxDistance = 250
    const connectionDistance = gridSize * 1.3

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      // Rebuild dots array on resize
      dots = []
      for (let x = 0; x < canvas.width; x += gridSize) {
        for (let y = 0; y < canvas.height; y += gridSize) {
          dots.push({
            x,
            y,
            baseX: x,
            baseY: y,
            vx: 0,
            vy: 0
          })
        }
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
    }

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 }
    }

    window.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseleave', handleMouseLeave)

    let animationId: number
    let lastTime = performance.now()

    const animate = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - lastTime) / 16, 2)
      lastTime = currentTime

      // Clear canvas
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update dots with smooth spring physics
      const dotsNearMouse: Dot[] = []

      dots.forEach((dot) => {
        const dx = mouseRef.current.x - dot.baseX
        const dy = mouseRef.current.y - dot.baseY
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < maxDistance) {
          // Apply magnetic effect with easing
          const force = Math.pow((maxDistance - distance) / maxDistance, 2)
          const targetX = dot.baseX + dx * force * 0.4
          const targetY = dot.baseY + dy * force * 0.4

          // Spring physics for smooth movement
          const springStrength = 0.15
          const damping = 0.8

          dot.vx += (targetX - dot.x) * springStrength
          dot.vy += (targetY - dot.y) * springStrength
          dot.vx *= damping
          dot.vy *= damping

          dot.x += dot.vx * deltaTime
          dot.y += dot.vy * deltaTime

          dotsNearMouse.push(dot)
        } else {
          // Return to base position with smooth easing
          const returnSpeed = 0.12
          dot.vx += (dot.baseX - dot.x) * returnSpeed
          dot.vy += (dot.baseY - dot.y) * returnSpeed
          dot.vx *= 0.85
          dot.vy *= 0.85

          dot.x += dot.vx * deltaTime
          dot.y += dot.vy * deltaTime
        }
      })

      // Draw connections only between nearby dots (optimized)
      ctx.lineWidth = 1
      const drawnConnections = new Set<string>()

      dots.forEach((dot, i) => {
        // Only check nearby dots for connections
        const startX = Math.floor((dot.x - connectionDistance) / gridSize)
        const endX = Math.ceil((dot.x + connectionDistance) / gridSize)
        const startY = Math.floor((dot.y - connectionDistance) / gridSize)
        const endY = Math.ceil((dot.y + connectionDistance) / gridSize)

        for (let gx = startX; gx <= endX; gx++) {
          for (let gy = startY; gy <= endY; gy++) {
            const otherIndex = Math.floor(gx * (canvas.height / gridSize) + gy)

            if (otherIndex <= i || otherIndex >= dots.length) continue

            const otherDot = dots[otherIndex]
            const dx = dot.x - otherDot.x
            const dy = dot.y - otherDot.y
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < connectionDistance && dist > 0) {
              const connectionKey = `${i}-${otherIndex}`
              if (drawnConnections.has(connectionKey)) continue
              drawnConnections.add(connectionKey)

              const opacity = Math.pow(1 - dist / connectionDistance, 2)
              const gradient = ctx.createLinearGradient(dot.x, dot.y, otherDot.x, otherDot.y)

              // Enhanced gradient with green tones
              gradient.addColorStop(0, `rgba(16, 185, 129, ${opacity * 0.3})`)
              gradient.addColorStop(0.5, `rgba(52, 211, 153, ${opacity * 0.25})`)
              gradient.addColorStop(1, `rgba(16, 185, 129, ${opacity * 0.3})`)

              ctx.strokeStyle = gradient
              ctx.beginPath()
              ctx.moveTo(dot.x, dot.y)
              ctx.lineTo(otherDot.x, otherDot.y)
              ctx.stroke()
            }
          }
        }
      })

      // Draw dots with glow effect
      dots.forEach((dot) => {
        const mouseDx = mouseRef.current.x - dot.x
        const mouseDy = mouseRef.current.y - dot.y
        const mouseDist = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy)

        const isNearMouse = mouseDist < maxDistance
        const proximityFactor = isNearMouse ? 1 - mouseDist / maxDistance : 0

        // Dynamic dot size with smooth scaling
        const baseSize = 1.8
        const maxSize = 4.5
        const dotSize = baseSize + proximityFactor * (maxSize - baseSize)

        // Enhanced opacity
        const baseOpacity = 0.2
        const maxOpacity = 0.3
        const dotOpacity = baseOpacity + proximityFactor * (maxOpacity - baseOpacity)

        // Draw glow effect for dots near mouse
        if (isNearMouse && proximityFactor > 0.3) {
          const glowSize = dotSize + 5 * proximityFactor
          const gradient = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, glowSize)
          gradient.addColorStop(0, `rgba(52, 211, 153, ${dotOpacity * 0.1})`)
          gradient.addColorStop(0.5, `rgba(16, 185, 129, ${dotOpacity * 0.1})`)
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0)')

          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(dot.x, dot.y, glowSize, 0, Math.PI * 2)
          ctx.fill()
        }

        // Draw main dot
        ctx.fillStyle = `rgba(52, 211, 153, ${dotOpacity})`
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, dotSize, 0, Math.PI * 2)
        ctx.fill()

        // Add inner highlight for larger dots
        if (dotSize > 3) {
          ctx.fillStyle = `rgba(110, 231, 183, ${dotOpacity * 0.6})`
          ctx.beginPath()
          ctx.arc(dot.x, dot.y, dotSize * 0.4, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      animationId = requestAnimationFrame(animate)
    }

    animate(performance.now())

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [isClient])

  if (!isClient) {
    return null
  }

  return (
    <canvas
      ref={canvasRef}
      className="z-0 fixed inset-0 pointer-events-none"
      style={{
        opacity: 0.7,
        mixBlendMode: 'screen',
        filter: 'blur(0.3px)'
      }}
    />
  )
}
