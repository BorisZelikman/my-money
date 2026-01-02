import { useEffect, useRef, useState } from 'react'
import styles from './FloatingIcons.module.css'

const ICONS = ['🚗', '🏠', '🍽️', '🛒', '🎁', '🏦', '💳', '✈️', '⛽', '💊', '🎓', '🏢']

interface IconState {
  x: number
  y: number
  vx: number
  vy: number
  targetX: number
  targetY: number
}

export function FloatingIcons() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [icons, setIcons] = useState<IconState[]>([])
  const animationRef = useRef<number>()

  // Initialize icons with random positions
  useEffect(() => {
    const initIcons = () => {
      const container = containerRef.current
      if (!container) return

      const width = container.clientWidth
      const height = container.clientHeight
      const iconSize = 64 // Approximate icon size
      const margin = 100

      const newIcons: IconState[] = ICONS.map((_, index) => {
        // Distribute icons around the edges, avoiding center where card is
        const angle = (index / ICONS.length) * Math.PI * 2
        const radius = Math.min(width, height) * 0.35
        const centerX = width / 2
        const centerY = height / 2
        
        let x = centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * margin
        let y = centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * margin

        // Keep within bounds
        x = Math.max(iconSize, Math.min(width - iconSize, x))
        y = Math.max(iconSize, Math.min(height - iconSize, y))

        return {
          x,
          y,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          targetX: x,
          targetY: y,
        }
      })

      setIcons(newIcons)
    }

    initIcons()
    window.addEventListener('resize', initIcons)
    return () => window.removeEventListener('resize', initIcons)
  }, [])

  // Animation loop with physics
  useEffect(() => {
    if (icons.length === 0) return

    const animate = () => {
      const container = containerRef.current
      if (!container) return

      const width = container.clientWidth
      const height = container.clientHeight
      const iconSize = 64
      const minDistance = 100 // Minimum distance between icons
      const repulsionStrength = 0.5
      const cardCenterX = width / 2
      const cardCenterY = height / 2
      const cardRepulsionRadius = 250 // Keep icons away from center (card area)

      setIcons(prevIcons => {
        return prevIcons.map((icon, i) => {
          let { x, y, vx, vy, targetX, targetY } = { ...icon }

          // Slowly drift toward new random targets
          if (Math.random() < 0.002) {
            const angle = Math.random() * Math.PI * 2
            const radius = Math.min(width, height) * 0.35 + (Math.random() - 0.5) * 100
            targetX = cardCenterX + Math.cos(angle) * radius
            targetY = cardCenterY + Math.sin(angle) * radius
            targetX = Math.max(iconSize, Math.min(width - iconSize, targetX))
            targetY = Math.max(iconSize, Math.min(height - iconSize, targetY))
          }

          // Move toward target
          const dx = targetX - x
          const dy = targetY - y
          vx += dx * 0.0001
          vy += dy * 0.0001

          // Repulsion from other icons
          prevIcons.forEach((other, j) => {
            if (i === j) return
            const diffX = x - other.x
            const diffY = y - other.y
            const dist = Math.sqrt(diffX * diffX + diffY * diffY)
            
            if (dist < minDistance && dist > 0) {
              const force = (minDistance - dist) / minDistance * repulsionStrength
              vx += (diffX / dist) * force
              vy += (diffY / dist) * force
            }
          })

          // Repulsion from center (where card is)
          const centerDiffX = x - cardCenterX
          const centerDiffY = y - cardCenterY
          const centerDist = Math.sqrt(centerDiffX * centerDiffX + centerDiffY * centerDiffY)
          
          if (centerDist < cardRepulsionRadius) {
            const force = (cardRepulsionRadius - centerDist) / cardRepulsionRadius * 0.8
            vx += (centerDiffX / centerDist) * force
            vy += (centerDiffY / centerDist) * force
          }

          // Apply velocity with damping
          vx *= 0.98
          vy *= 0.98
          x += vx
          y += vy

          // Bounce off walls
          if (x < iconSize) { x = iconSize; vx *= -0.5 }
          if (x > width - iconSize) { x = width - iconSize; vx *= -0.5 }
          if (y < iconSize) { y = iconSize; vy *= -0.5 }
          if (y > height - iconSize) { y = height - iconSize; vy *= -0.5 }

          return { x, y, vx, vy, targetX, targetY }
        })
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [icons.length])

  return (
    <div ref={containerRef} className={styles.container}>
      {icons.map((icon, index) => (
        <span
          key={index}
          className={styles.icon}
          style={{
            transform: `translate(${icon.x}px, ${icon.y}px)`,
          }}
        >
          {ICONS[index]}
        </span>
      ))}
    </div>
  )
}

