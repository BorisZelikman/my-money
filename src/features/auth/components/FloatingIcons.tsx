import { useState, useEffect, useRef, useCallback } from 'react'
import { useDeviceMotion } from '@/hooks/useDeviceMotion'
import styles from './FloatingIcons.module.css'

interface Icon {
  id: number
  emoji: string
  x: number
  y: number
  vx: number
  vy: number
  size: number
}

const ICONS = ['🚗', '🏠', '🍽️', '🛒', '🎁', '🏦', '💳', '✈️', '⛽', '💊', '🎓', '🏢']

// Physics constants - "oil-like" viscous behavior
const FRICTION = 0.92 // High friction for viscous feel
const GRAVITY_STRENGTH = 0.15 // How much device tilt affects movement
const REPULSION_STRENGTH = 800 // How strongly icons push each other
const REPULSION_DISTANCE = 120 // Distance at which repulsion starts
const SHAKE_FORCE = 15 // Force applied when shaking
const BOUNDARY_BOUNCE = 0.3 // Energy retained when hitting boundary
const MAX_VELOCITY = 3 // Maximum velocity cap

export function FloatingIcons() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [icons, setIcons] = useState<Icon[]>([])
  const animationRef = useRef<number>()
  const deviceMotion = useDeviceMotion()
  const lastShakeRef = useRef(0)

  // Initialize icons with random positions
  useEffect(() => {
    const initIcons = ICONS.map((emoji, id) => ({
      id,
      emoji,
      x: Math.random() * 80 + 10, // 10-90% of container
      y: Math.random() * 80 + 10,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: 3 + Math.random() * 1.5, // 3-4.5rem
    }))
    setIcons(initIcons)
  }, [])

  const updatePhysics = useCallback(() => {
    setIcons(prevIcons => {
      const container = containerRef.current
      if (!container) return prevIcons

      const rect = container.getBoundingClientRect()
      const width = rect.width
      const height = rect.height

      // Card boundaries (approximate center card area to avoid)
      const cardCenterX = 50
      const cardCenterY = 50
      const cardWidth = 45 // percentage
      const cardHeight = 60 // percentage

      return prevIcons.map((icon, i) => {
        let { x, y, vx, vy } = icon

        // Apply device tilt gravity
        vx += deviceMotion.x * GRAVITY_STRENGTH
        vy += deviceMotion.y * GRAVITY_STRENGTH

        // Apply shake force
        if (deviceMotion.shake > lastShakeRef.current + 0.1) {
          vx += (Math.random() - 0.5) * SHAKE_FORCE * deviceMotion.shake
          vy += (Math.random() - 0.5) * SHAKE_FORCE * deviceMotion.shake
        }
        lastShakeRef.current = deviceMotion.shake

        // Repulsion from other icons
        for (let j = 0; j < prevIcons.length; j++) {
          if (i === j) continue
          const other = prevIcons[j]
          
          const dx = (x - other.x) * width / 100
          const dy = (y - other.y) * height / 100
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < REPULSION_DISTANCE && distance > 0) {
            const force = REPULSION_STRENGTH / (distance * distance)
            const nx = dx / distance
            const ny = dy / distance
            vx += nx * force * 0.01
            vy += ny * force * 0.01
          }
        }

        // Repulsion from card center
        const cardDx = (x - cardCenterX)
        const cardDy = (y - cardCenterY)
        const cardDistance = Math.sqrt(cardDx * cardDx + cardDy * cardDy)
        
        if (Math.abs(x - cardCenterX) < cardWidth / 2 + 10 && 
            Math.abs(y - cardCenterY) < cardHeight / 2 + 10) {
          const force = 2
          vx += (cardDx / cardDistance) * force
          vy += (cardDy / cardDistance) * force
        }

        // Apply friction (viscous oil effect)
        vx *= FRICTION
        vy *= FRICTION

        // Clamp velocity
        const speed = Math.sqrt(vx * vx + vy * vy)
        if (speed > MAX_VELOCITY) {
          vx = (vx / speed) * MAX_VELOCITY
          vy = (vy / speed) * MAX_VELOCITY
        }

        // Update position
        x += vx
        y += vy

        // Boundary collision
        const margin = 5
        if (x < margin) { x = margin; vx *= -BOUNDARY_BOUNCE }
        if (x > 100 - margin) { x = 100 - margin; vx *= -BOUNDARY_BOUNCE }
        if (y < margin) { y = margin; vy *= -BOUNDARY_BOUNCE }
        if (y > 100 - margin) { y = 100 - margin; vy *= -BOUNDARY_BOUNCE }

        return { ...icon, x, y, vx, vy }
      })
    })

    animationRef.current = requestAnimationFrame(updatePhysics)
  }, [deviceMotion])

  useEffect(() => {
    animationRef.current = requestAnimationFrame(updatePhysics)
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [updatePhysics])

  return (
    <div ref={containerRef} className={styles.container}>
      {icons.map(icon => (
        <span
          key={icon.id}
          className={styles.icon}
          style={{
            left: `${icon.x}%`,
            top: `${icon.y}%`,
            fontSize: `${icon.size}rem`,
            transform: `translate(-50%, -50%)`,
          }}
        >
          {icon.emoji}
        </span>
      ))}
    </div>
  )
}

