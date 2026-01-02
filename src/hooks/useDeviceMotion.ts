import { useState, useEffect, useCallback } from 'react'

interface DeviceMotion {
  x: number // tilt left/right (-1 to 1)
  y: number // tilt forward/back (-1 to 1)
  shake: number // shake intensity (0 to 1)
}

export function useDeviceMotion(): DeviceMotion {
  const [motion, setMotion] = useState<DeviceMotion>({ x: 0, y: 0, shake: 0 })
  const [lastAccel, setLastAccel] = useState({ x: 0, y: 0, z: 0 })
  const [shakeDecay, setShakeDecay] = useState(0)

  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    // gamma: left/right tilt (-90 to 90)
    // beta: front/back tilt (-180 to 180)
    const gamma = event.gamma || 0
    const beta = event.beta || 0

    // Normalize to -1 to 1 range
    const x = Math.max(-1, Math.min(1, gamma / 45))
    const y = Math.max(-1, Math.min(1, (beta - 45) / 45)) // 45 is "neutral" holding position

    setMotion(prev => ({ ...prev, x, y }))
  }, [])

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    const accel = event.accelerationIncludingGravity
    if (!accel || accel.x === null || accel.y === null || accel.z === null) return

    const deltaX = Math.abs(accel.x - lastAccel.x)
    const deltaY = Math.abs(accel.y - lastAccel.y)
    const deltaZ = Math.abs(accel.z - lastAccel.z)
    
    const shakeIntensity = (deltaX + deltaY + deltaZ) / 30
    
    if (shakeIntensity > 0.3) {
      setShakeDecay(Math.min(1, shakeIntensity))
    }

    setLastAccel({ x: accel.x, y: accel.y, z: accel.z })
  }, [lastAccel])

  // Decay shake over time
  useEffect(() => {
    if (shakeDecay > 0) {
      const timer = setTimeout(() => {
        setShakeDecay(prev => Math.max(0, prev - 0.05))
        setMotion(prev => ({ ...prev, shake: shakeDecay }))
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [shakeDecay])

  useEffect(() => {
    // Check if device orientation is supported
    if (typeof DeviceOrientationEvent !== 'undefined') {
      // iOS 13+ requires permission
      const requestPermission = (DeviceOrientationEvent as any).requestPermission
      if (typeof requestPermission === 'function') {
        // We'll request permission on first user interaction
        const handleClick = async () => {
          try {
            const permission = await requestPermission()
            if (permission === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation)
              window.addEventListener('devicemotion', handleMotion)
            }
          } catch {
            // Permission denied or error
          }
          document.removeEventListener('click', handleClick)
        }
        document.addEventListener('click', handleClick, { once: true })
      } else {
        // Non-iOS devices
        window.addEventListener('deviceorientation', handleOrientation)
        window.addEventListener('devicemotion', handleMotion)
      }
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation)
      window.removeEventListener('devicemotion', handleMotion)
    }
  }, [handleOrientation, handleMotion])

  return motion
}

