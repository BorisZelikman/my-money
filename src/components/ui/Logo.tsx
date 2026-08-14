import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useReducedMotion } from 'framer-motion'
import styles from './Logo.module.css'

interface LogoProps {
  style?: React.CSSProperties
  isBig?: boolean
}

type MotionPermission = 'granted' | 'denied'

type PermissionAwareDeviceMotionEvent = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<MotionPermission>
}

const COIN_TRAVEL = -230
const COMPACT_COIN_TRAVEL = -116

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function MetalCoinArtwork() {
  const id = useId().replace(/:/g, '')
  const outerMetal = `${id}-outer-metal`
  const innerMetal = `${id}-inner-metal`
  const edgeMetal = `${id}-edge-metal`
  const grain = `${id}-grain`
  const numeralRelief = `${id}-numeral-relief`
  const numeralClip = `${id}-numeral-clip`

  return (
    <svg
      className={styles.coinArtwork}
      viewBox="0 0 120 120"
      focusable="false"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={outerMetal} x1="10%" y1="5%" x2="90%" y2="95%">
          <stop offset="0" stopColor="#6f7479" />
          <stop offset="0.16" stopColor="#f5f3eb" />
          <stop offset="0.34" stopColor="#9da1a4" />
          <stop offset="0.56" stopColor="#eceae2" />
          <stop offset="0.78" stopColor="#747a80" />
          <stop offset="1" stopColor="#c7c9c7" />
        </linearGradient>
        <radialGradient id={innerMetal} cx="31%" cy="23%" r="82%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.14" stopColor="#d9dadd" />
          <stop offset="0.31" stopColor="#f2f0e9" />
          <stop offset="0.51" stopColor="#a6aaae" />
          <stop offset="0.68" stopColor="#e0dfd8" />
          <stop offset="0.84" stopColor="#858a90" />
          <stop offset="1" stopColor="#d4d5d1" />
        </radialGradient>
        <linearGradient id={edgeMetal} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#faf9f3" />
          <stop offset="0.48" stopColor="#777c82" />
          <stop offset="0.72" stopColor="#f1efe8" />
          <stop offset="1" stopColor="#5f656b" />
        </linearGradient>
        <filter id={grain} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.82"
            numOctaves="2"
            seed="7"
            result="noise"
          />
          <feColorMatrix
            in="noise"
            type="matrix"
            values="0.2 0 0 0 0.42  0 0.2 0 0 0.42  0 0 0.2 0 0.42  0 0 0 0.13 0"
            result="softNoise"
          />
          <feComposite
            in="softNoise"
            in2="SourceAlpha"
            operator="in"
            result="clippedNoise"
          />
          <feBlend in="SourceGraphic" in2="clippedNoise" mode="soft-light" />
        </filter>
        <filter
          id={numeralRelief}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feDropShadow dx="-1.15" dy="-1.15" stdDeviation="0.42" floodColor="#ffffff" floodOpacity="0.78" />
          <feDropShadow dx="1.4" dy="1.65" stdDeviation="0.58" floodColor="#252a2f" floodOpacity="0.7" />
        </filter>
        <clipPath id={numeralClip}>
          <circle cx="60" cy="60" r="47.5" />
        </clipPath>
      </defs>

      <circle cx="60" cy="60" r="58" fill="#555b61" />
      <circle cx="60" cy="60" r="56.5" fill={`url(#${edgeMetal})`} />
      <circle
        cx="60"
        cy="60"
        r="54.5"
        fill="none"
        stroke="#3f454b"
        strokeWidth="1.2"
        strokeDasharray="0.8 1.55"
        opacity="0.72"
      />
      <circle cx="60" cy="60" r="52.5" fill={`url(#${outerMetal})`} />
      <circle
        cx="60"
        cy="60"
        r="49.5"
        fill={`url(#${innerMetal})`}
        filter={`url(#${grain})`}
      />

      <g className={styles.coinGrooves} fill="none">
        <circle cx="60" cy="60" r="45.5" />
        <circle cx="60" cy="60" r="39" />
        <circle cx="60" cy="60" r="32.5" />
      </g>
      <text
        className={styles.coinNumeral}
        x="58"
        y="48"
        textAnchor="middle"
        dominantBaseline="central"
        filter={`url(#${numeralRelief})`}
        clipPath={`url(#${numeralClip})`}
      >
        1
      </text>
      <path
        d="M23 50C31 25 57 13 80 24"
        fill="none"
        stroke="rgba(255,255,255,.5)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M93 69C87 91 62 103 39 94"
        fill="none"
        stroke="rgba(118,123,126,.18)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Logo({ style, isBig = false }: LogoProps) {
  const reduceMotion = useReducedMotion()
  const shouldAnimate = !reduceMotion
  const coinTravel = isBig ? COIN_TRAVEL : COMPACT_COIN_TRAVEL

  const containerRef = useRef<HTMLDivElement>(null)
  const coinStageRef = useRef<HTMLSpanElement>(null)
  const coinRef = useRef<HTMLSpanElement>(null)
  const mLetterRef = useRef<HTMLSpanElement>(null)
  const coinDiameterRef = useRef(isBig ? 84 : 44)
  const insertionDistanceRef = useRef(isBig ? 100 : 56)
  const letterTopOffsetRef = useRef(isBig ? -18 : -8)
  const movementRef = useRef<{ stop: () => void } | null>(null)
  const liftMovementRef = useRef<{ stop: () => void } | null>(null)
  const appearanceRef = useRef<{ stop: () => void } | null>(null)
  const motionPermissionRequestedRef = useRef(false)
  const motionSampleRef = useRef({
    gravityX: 0,
    gravityY: 0,
    gravityZ: 0,
    gravityInitialized: false,
    lastTrigger: 0,
  })
  const animationRunRef = useRef(0)
  const slingshotRef = useRef(false)
  const elevationRef = useRef(false)
  const initialDropRef = useRef(false)
  const shotDirectionRef = useRef<-1 | 1>(-1)
  const pointerRef = useRef({
    id: -1,
    startX: 0,
    startY: 0,
    startCoinX: 0,
    startCoinY: 0,
    dragged: false,
    mode: 'pending' as 'pending' | 'horizontal' | 'vertical',
  })
  const [replayKey, setReplayKey] = useState(0)
  const [motionEnabled, setMotionEnabled] = useState(false)

  const coinX = useMotionValue(shouldAnimate && !isBig ? coinTravel : 0)
  const coinY = useMotionValue(0)
  const coinScale = useMotionValue(1)
  const coinRotation = useMotionValue(0)
  const coinOpacity = useMotionValue(shouldAnimate ? 0 : 1)
  const mPosition = useMotionValue(0)
  const yPosition = useMotionValue(shouldAnimate ? -insertionDistanceRef.current : 0)
  const reflectionOpacity = useMotionValue(0.29)
  const reflectionScaleX = useMotionValue(1)
  const reflectionScaleY = useMotionValue(1)
  const reflectionY = useMotionValue(0)
  const shadowOpacity = useMotionValue(1)
  const shadowScaleX = useMotionValue(1)
  const shadowScaleY = useMotionValue(1)

  const syncLettersWithCoin = useCallback((position: number) => {
    if (elevationRef.current) return

    const insertionDistance = insertionDistanceRef.current
    const maxPull = isBig ? 140 : 86

    if (slingshotRef.current) {
      if (shotDirectionRef.current < 0) {
        mPosition.set(0)
        yPosition.set(clamp(position, -insertionDistance, maxPull))
      } else {
        mPosition.set(clamp(position, -maxPull, insertionDistance))
        yPosition.set(0)
      }
      return
    }

    if (pointerRef.current.id !== -1) {
      if (position < 0) {
        mPosition.set(position)
        yPosition.set(0)
      } else {
        mPosition.set(0)
        yPosition.set(position)
      }
      return
    }

    mPosition.set(0)
    yPosition.set(clamp(position, -insertionDistance, 0))
  }, [isBig, mPosition, yPosition])

  const syncSurfaceVisuals = useCallback((position: number) => {
    const maxLift = isBig ? 150 : 52
    const liftRatio = clamp(-position / maxLift, 0, 1)

    coinScale.set(1 + liftRatio * 0.075)
    shadowOpacity.set(1 - liftRatio * 0.74)
    shadowScaleX.set(1 + liftRatio * 0.68)
    shadowScaleY.set(1 + liftRatio * 0.18)

    reflectionOpacity.set(0.29 * (1 - liftRatio * 0.88))
    reflectionScaleX.set(1 + liftRatio * 0.16)
    reflectionScaleY.set(1 - liftRatio * 0.34)
    reflectionY.set(liftRatio * 11)
  }, [coinScale, isBig, reflectionOpacity, reflectionScaleX, reflectionScaleY, reflectionY, shadowOpacity, shadowScaleX, shadowScaleY])

  const syncElevationVisuals = useCallback((position: number) => {
    const maxLift = isBig ? 150 : 52
    const liftRatio = clamp(-position / maxLift, 0, 1)
    const closureDistance = insertionDistanceRef.current * 0.42 * liftRatio

    syncSurfaceVisuals(position)
    mPosition.set(closureDistance)
    yPosition.set(-closureDistance)
  }, [isBig, mPosition, syncSurfaceVisuals, yPosition])

  const syncInitialDropVisuals = useCallback((position: number) => {
    syncSurfaceVisuals(position)
    coinScale.set(1)

    const radius = coinDiameterRef.current / 2
    const distanceFromCoinCenter = Math.max(
      0,
      letterTopOffsetRef.current - position,
    )
    const visibleHalfWidth = distanceFromCoinCenter < radius
      ? Math.sqrt(radius ** 2 - distanceFromCoinCenter ** 2)
      : 0
    const closureDistance = radius - visibleHalfWidth

    mPosition.set(closureDistance)
    yPosition.set(-closureDistance)
  }, [coinScale, mPosition, syncSurfaceVisuals, yPosition])

  useLayoutEffect(() => {
    const updateMeasurements = () => {
      // offsetWidth is unaffected by rotation; bounding boxes are not.
      const diameter = coinRef.current?.offsetWidth
      const container = containerRef.current

      if (diameter) {
        coinDiameterRef.current = diameter
      }

      if (container && diameter) {
        const gap = Number.parseFloat(getComputedStyle(container).columnGap) || 0
        insertionDistanceRef.current = diameter + gap * 2
      }

      const stageRect = coinStageRef.current?.getBoundingClientRect()
      const letterRect = mLetterRef.current?.getBoundingClientRect()
      if (stageRect && letterRect) {
        letterTopOffsetRef.current = letterRect.top
          - (stageRect.top + stageRect.height / 2)
      }

      const position = coinX.get()
      const circumference = Math.PI * coinDiameterRef.current
      coinRotation.set((position / circumference) * 360)
      if (isBig && shouldAnimate && animationRunRef.current === 0) {
        const closureDistance = coinDiameterRef.current / 2
        mPosition.set(closureDistance)
        yPosition.set(-closureDistance)
      } else if (shouldAnimate) {
        syncLettersWithCoin(position)
      } else {
        mPosition.set(0)
        yPosition.set(0)
      }
    }

    updateMeasurements()

    const observer = new ResizeObserver(updateMeasurements)
    if (containerRef.current) observer.observe(containerRef.current)
    if (coinRef.current) observer.observe(coinRef.current)

    return () => observer.disconnect()
  }, [coinRotation, coinX, isBig, mPosition, shouldAnimate, syncLettersWithCoin, yPosition])

  const playInitialAnimation = useCallback(() => {
    if (!shouldAnimate) {
      coinX.set(0)
      coinY.set(0)
      coinScale.set(1)
      coinRotation.set(0)
      coinOpacity.set(1)
      mPosition.set(0)
      yPosition.set(0)
      syncElevationVisuals(0)
      return
    }

    movementRef.current?.stop()
    liftMovementRef.current?.stop()
    appearanceRef.current?.stop()
    animationRunRef.current += 1
    slingshotRef.current = false
    elevationRef.current = false
    initialDropRef.current = false
    pointerRef.current.id = -1

    if (isBig) {
      const runId = animationRunRef.current
      const stageRect = coinStageRef.current?.getBoundingClientRect()
      const viewportTop = window.visualViewport?.offsetTop ?? 0
      const stageTop = stageRect?.top ?? window.innerHeight / 2
      const startPosition = viewportTop
        - stageTop
        - coinDiameterRef.current
        - 12
      const firstBounce = -coinDiameterRef.current * 0.5
      const secondBounce = -coinDiameterRef.current * 0.28
      const thirdBounce = -coinDiameterRef.current * 0.1
      const fallDuration = clamp(
        0.42 + Math.abs(startPosition) / 1800,
        0.56,
        0.72,
      )
      const firstBounceDuration = 0.3
      const secondBounceDuration = 0.25
      const thirdBounceDuration = 0.18
      const totalDuration = fallDuration
        + firstBounceDuration
        + secondBounceDuration
        + thirdBounceDuration
      const firstBounceEnd = fallDuration + firstBounceDuration
      const secondBounceEnd = firstBounceEnd + secondBounceDuration

      initialDropRef.current = true
      coinX.set(0)
      coinRotation.set(0)
      coinY.set(startPosition)
      syncInitialDropVisuals(startPosition)
      coinOpacity.set(1)
      setReplayKey((key) => key + 1)

      const drop = animate(
        coinY,
        [
          startPosition,
          0,
          firstBounce,
          0,
          secondBounce,
          0,
          thirdBounce,
          0,
        ],
        {
          duration: totalDuration,
          times: [
            0,
            fallDuration / totalDuration,
            (fallDuration + firstBounceDuration * 0.48) / totalDuration,
            firstBounceEnd / totalDuration,
            (firstBounceEnd + secondBounceDuration * 0.48) / totalDuration,
            secondBounceEnd / totalDuration,
            (secondBounceEnd + thirdBounceDuration * 0.48) / totalDuration,
            1,
          ],
          ease: [
            [0.55, 0.055, 0.675, 0.19],
            [0.12, 0.7, 0.3, 1],
            [0.55, 0.055, 0.675, 0.19],
            [0.12, 0.7, 0.3, 1],
            [0.55, 0.055, 0.675, 0.19],
            [0.12, 0.7, 0.3, 1],
            [0.55, 0.055, 0.675, 0.19],
          ],
        },
      )
      liftMovementRef.current = drop

      void drop.then(() => {
        if (animationRunRef.current !== runId) return
        initialDropRef.current = false
        coinY.set(0)
        syncElevationVisuals(0)
      })
      return
    }

    coinX.set(coinTravel)
    coinY.set(0)
    syncElevationVisuals(0)
    coinOpacity.set(0)
    yPosition.set(-insertionDistanceRef.current)
    setReplayKey((key) => key + 1)

    appearanceRef.current = animate(coinOpacity, 1, {
      delay: 0.4,
      duration: 0.12,
      ease: 'easeOut',
    })

    movementRef.current = animate(coinX, 0, {
      delay: 0.46,
      duration: 1.12,
      ease: [0.22, 0.68, 0.42, 1],
    })
  }, [coinOpacity, coinRotation, coinScale, coinTravel, coinX, coinY, isBig, mPosition, shouldAnimate, syncElevationVisuals, syncInitialDropVisuals, yPosition])

  const replayAnimation = useCallback(() => {
    if (!shouldAnimate) return

    if (isBig) {
      playInitialAnimation()
      return
    }

    movementRef.current?.stop()
    liftMovementRef.current?.stop()
    appearanceRef.current?.stop()
    slingshotRef.current = false
    elevationRef.current = false
    initialDropRef.current = false
    pointerRef.current.id = -1
    coinY.set(0)
    syncElevationVisuals(0)

    const runId = animationRunRef.current + 1
    animationRunRef.current = runId
    const currentPosition = coinX.get()
    const backwardDistance = Math.abs(currentPosition - coinTravel)
    const backwardDuration = Math.max(
      0.18,
      0.5 * (backwardDistance / Math.abs(coinTravel)),
    )

    coinOpacity.set(1)

    const backward = animate(coinX, coinTravel, {
      duration: backwardDuration,
      ease: [0.42, 0, 0.58, 1],
    })
    movementRef.current = backward

    void backward.then(() => {
      if (animationRunRef.current !== runId) return

      setReplayKey((key) => key + 1)
      const forward = animate(coinX, 0, {
        duration: 0.86,
        ease: [0.22, 0.68, 0.42, 1],
      })
      movementRef.current = forward
    })
  }, [coinOpacity, coinTravel, coinX, coinY, isBig, playInitialAnimation, shouldAnimate, syncElevationVisuals])

  const dropCoin = useCallback((startPosition: number) => {
    if (!shouldAnimate) return

    liftMovementRef.current?.stop()
    const runId = animationRunRef.current + 1
    animationRunRef.current = runId
    elevationRef.current = true
    initialDropRef.current = false

    const maxLift = isBig ? 150 : 52
    const liftStrength = clamp(Math.abs(startPosition) / maxLift, 0, 1)
    const bounceOne = -Math.max(4, Math.abs(startPosition) * 0.28)
    const bounceTwo = bounceOne * 0.38
    const bounceThree = bounceOne * 0.14
    const fallDuration = 0.16 + liftStrength * 0.2
    const bounceOneDuration = 0.2 + liftStrength * 0.06
    const bounceTwoDuration = 0.15 + liftStrength * 0.04
    const bounceThreeDuration = 0.11 + liftStrength * 0.03
    const totalDuration = fallDuration
      + bounceOneDuration
      + bounceTwoDuration
      + bounceThreeDuration
    const fallEnd = fallDuration / totalDuration
    const bounceOneEnd = (fallDuration + bounceOneDuration) / totalDuration
    const bounceTwoEnd = (
      fallDuration + bounceOneDuration + bounceTwoDuration
    ) / totalDuration

    const fall = animate(
      coinY,
      [
        startPosition,
        0,
        bounceOne,
        0,
        bounceTwo,
        0,
        bounceThree,
        0,
      ],
      {
        duration: totalDuration,
        times: [
          0,
          fallEnd,
          fallEnd + (bounceOneEnd - fallEnd) * 0.48,
          bounceOneEnd,
          bounceOneEnd + (bounceTwoEnd - bounceOneEnd) * 0.48,
          bounceTwoEnd,
          bounceTwoEnd + (1 - bounceTwoEnd) * 0.38,
          1,
        ],
        ease: [
          [0.42, 0, 1, 1],
          [0.12, 0.7, 0.3, 1],
          [0.42, 0, 1, 1],
          [0.12, 0.7, 0.3, 1],
          [0.42, 0, 1, 1],
          [0.12, 0.7, 0.3, 1],
          [0.42, 0, 1, 1],
        ],
      },
    )
    liftMovementRef.current = fall

    void fall.then(() => {
      if (animationRunRef.current !== runId) return
      elevationRef.current = false
      coinY.set(0)
      syncElevationVisuals(0)
    })
  }, [coinY, isBig, shouldAnimate, syncElevationVisuals])

  const launchSlingshot = useCallback((pullPosition: number) => {
    if (!shouldAnimate) return

    movementRef.current?.stop()
    appearanceRef.current?.stop()

    const runId = animationRunRef.current + 1
    animationRunRef.current = runId
    slingshotRef.current = true
    elevationRef.current = false
    initialDropRef.current = false
    coinY.set(0)
    syncElevationVisuals(0)
    const shotDirection: -1 | 1 = pullPosition > 0 ? -1 : 1
    shotDirectionRef.current = shotDirection
    coinOpacity.set(1)
    setReplayKey((key) => key + 1)

    const maxPull = isBig ? 140 : 86
    const pullStrength = Math.min(1, Math.abs(pullPosition) / maxPull)
    const stage = coinStageRef.current
    const currentPosition = coinX.get()
    const stageRect = stage?.getBoundingClientRect()
    const viewport = window.visualViewport
    const viewportLeft = viewport?.offsetLeft ?? 0
    const viewportWidth = viewport?.width ?? window.innerWidth
    const viewportRight = viewportLeft + viewportWidth
    const edgePadding = isBig ? 8 : 4
    const stageWidth = stageRect?.width ?? coinDiameterRef.current
    const restingLeft = stageRect
      ? stageRect.left - currentPosition
      : (viewportWidth - stageWidth) / 2
    const edgePosition = shotDirection < 0
      ? viewportLeft + edgePadding - restingLeft
      : viewportRight - edgePadding - stageWidth - restingLeft
    const distanceToEdge = Math.max(0, shotDirection * edgePosition)
    const edgeStrength = 0.72
    const flightFraction = Math.min(
      1,
      Math.pow(pullStrength / edgeStrength, 0.85),
    )
    const turnPosition = shotDirection * distanceToEdge * flightFraction
    const shotDistance = Math.abs(turnPosition - currentPosition)
    const launchSpeed = 280 + pullStrength * 620
    const returnSpeed = 190 + pullStrength * 310
    const shotDuration = clamp(shotDistance / launchSpeed, 0.14, 0.6)
    const returnDuration = clamp(
      Math.abs(turnPosition) / returnSpeed,
      0.18,
      0.75,
    )
    const totalDuration = shotDuration + returnDuration

    syncLettersWithCoin(currentPosition)

    const roll = animate(
      coinX,
      [currentPosition, turnPosition, 0],
      {
        duration: totalDuration,
        times: [
          0,
          shotDuration / totalDuration,
          1,
        ],
        ease: [
          [0.45, 0, 0.9, 0.7],
          [0.1, 0.5, 0.25, 1],
        ],
      },
    )
    movementRef.current = roll

    void roll.then(() => {
      if (animationRunRef.current !== runId) return
      slingshotRef.current = false
      coinX.set(0)
      mPosition.set(0)
      yPosition.set(0)
    })
  }, [coinOpacity, coinX, coinY, isBig, mPosition, shouldAnimate, syncElevationVisuals, syncLettersWithCoin, yPosition])

  const launchShakeAnimation = useCallback((strength: number, horizontalForce: number) => {
    if (!shouldAnimate) return

    movementRef.current?.stop()
    liftMovementRef.current?.stop()
    appearanceRef.current?.stop()

    const runId = animationRunRef.current + 1
    animationRunRef.current = runId
    slingshotRef.current = false
    elevationRef.current = true
    initialDropRef.current = false
    pointerRef.current.id = -1

    const normalizedStrength = clamp(strength, 0, 1)
    const maxLift = isBig ? 150 : 52
    const liftHeight = maxLift * (0.24 + normalizedStrength * 0.76)
    const sideLimit = isBig ? 72 : 28
    const sideShift = clamp(
      horizontalForce * (isBig ? 5 : 2.2),
      -sideLimit,
      sideLimit,
    ) * (0.5 + normalizedStrength * 0.5)
    const bounceOne = -liftHeight * 0.24
    const bounceTwo = -liftHeight * 0.08
    const bounceThree = -liftHeight * 0.025
    const duration = 0.58 + normalizedStrength * 0.2

    coinOpacity.set(1)
    coinX.set(0)
    coinY.set(0)
    syncElevationVisuals(0)
    setReplayKey((key) => key + 1)

    const verticalImpulse = animate(
      coinY,
      [0, -liftHeight, 0, bounceOne, 0, bounceTwo, 0, bounceThree, 0],
      {
        duration,
        times: [0, 0.14, 0.38, 0.52, 0.66, 0.77, 0.87, 0.94, 1],
        ease: [
          [0.18, 0.72, 0.3, 1],
          [0.55, 0.055, 0.675, 0.19],
          [0.12, 0.7, 0.3, 1],
          [0.55, 0.055, 0.675, 0.19],
          [0.12, 0.7, 0.3, 1],
          [0.55, 0.055, 0.675, 0.19],
          [0.12, 0.7, 0.3, 1],
          [0.55, 0.055, 0.675, 0.19],
        ],
      },
    )
    liftMovementRef.current = verticalImpulse

    const horizontalImpulse = animate(
      coinX,
      [0, sideShift, sideShift * 0.38, 0],
      {
        duration,
        times: [0, 0.22, 0.55, 1],
        ease: [
          [0.18, 0.72, 0.3, 1],
          [0.2, 0.5, 0.3, 1],
          [0.12, 0.7, 0.3, 1],
        ],
      },
    )
    movementRef.current = horizontalImpulse

    void verticalImpulse.then(() => {
      if (animationRunRef.current !== runId) return
      elevationRef.current = false
      coinX.set(0)
      coinY.set(0)
      syncElevationVisuals(0)
    })
  }, [coinOpacity, coinX, coinY, isBig, shouldAnimate, syncElevationVisuals])

  const requestMotionAccess = useCallback(() => {
    if (
      !shouldAnimate
      || motionEnabled
      || motionPermissionRequestedRef.current
      || !window.isSecureContext
      || typeof DeviceMotionEvent === 'undefined'
    ) {
      return
    }

    motionPermissionRequestedRef.current = true
    const motionEvent = DeviceMotionEvent as PermissionAwareDeviceMotionEvent

    if (typeof motionEvent.requestPermission === 'function') {
      void motionEvent.requestPermission()
        .then((permission) => {
          setMotionEnabled(permission === 'granted')
        })
        .catch(() => {
          motionPermissionRequestedRef.current = false
        })
      return
    }

    setMotionEnabled(true)
  }, [motionEnabled, shouldAnimate])

  useEffect(() => {
    if (!motionEnabled || !shouldAnimate) return

    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      if (document.visibilityState !== 'visible' || pointerRef.current.id !== -1) {
        return
      }

      const sample = motionSampleRef.current
      let accelerationX = event.acceleration?.x
      let accelerationY = event.acceleration?.y
      let accelerationZ = event.acceleration?.z

      if (
        accelerationX == null
        || accelerationY == null
        || accelerationZ == null
      ) {
        const rawX = event.accelerationIncludingGravity?.x
        const rawY = event.accelerationIncludingGravity?.y
        const rawZ = event.accelerationIncludingGravity?.z
        if (rawX == null || rawY == null || rawZ == null) return

        if (!sample.gravityInitialized) {
          sample.gravityX = rawX
          sample.gravityY = rawY
          sample.gravityZ = rawZ
          sample.gravityInitialized = true
          return
        }

        const gravityBlend = 0.82
        sample.gravityX = gravityBlend * sample.gravityX + (1 - gravityBlend) * rawX
        sample.gravityY = gravityBlend * sample.gravityY + (1 - gravityBlend) * rawY
        sample.gravityZ = gravityBlend * sample.gravityZ + (1 - gravityBlend) * rawZ
        accelerationX = rawX - sample.gravityX
        accelerationY = rawY - sample.gravityY
        accelerationZ = rawZ - sample.gravityZ
      }

      const magnitude = Math.hypot(accelerationX, accelerationY, accelerationZ)
      const now = Date.now()
      const shakeThreshold = 7.5
      if (magnitude < shakeThreshold || now - sample.lastTrigger < 850) return

      sample.lastTrigger = now
      const strength = clamp((magnitude - shakeThreshold) / 14, 0.12, 1)
      launchShakeAnimation(strength, accelerationX)
    }

    window.addEventListener('devicemotion', handleDeviceMotion)
    return () => window.removeEventListener('devicemotion', handleDeviceMotion)
  }, [launchShakeAnimation, motionEnabled, shouldAnimate])

  useEffect(() => {
    if (!shouldAnimate) {
      playInitialAnimation()
      return
    }

    const unsubscribe = coinX.on('change', (position) => {
      const circumference = Math.PI * coinDiameterRef.current

      // A rolling circle turns by exactly distance / radius.
      coinRotation.set((position / circumference) * 360)

      syncLettersWithCoin(position)
    })
    const unsubscribeY = coinY.on('change', (position) => {
      if (initialDropRef.current) {
        syncInitialDropVisuals(position)
      } else {
        syncElevationVisuals(position)
      }
    })

    playInitialAnimation()

    return () => {
      movementRef.current?.stop()
      liftMovementRef.current?.stop()
      appearanceRef.current?.stop()
      unsubscribe()
      unsubscribeY()
    }
  }, [coinRotation, coinX, coinY, playInitialAnimation, shouldAnimate, syncElevationVisuals, syncInitialDropVisuals, syncLettersWithCoin])

  const handleCoinKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      requestMotionAccess()
      replayAnimation()
    }
  }

  const handleCoinPointerDown = (event: React.PointerEvent<HTMLSpanElement>) => {
    if (!shouldAnimate || event.button !== 0) return

    movementRef.current?.stop()
    liftMovementRef.current?.stop()
    appearanceRef.current?.stop()
    animationRunRef.current += 1
    slingshotRef.current = false
    elevationRef.current = false
    initialDropRef.current = false
    coinOpacity.set(1)

    const maxPull = isBig ? 140 : 86
    const maxLift = isBig ? 150 : 52
    const startCoinX = clamp(coinX.get(), -maxPull, maxPull)
    const startCoinY = clamp(coinY.get(), -maxLift, 0)
    coinX.set(startCoinX)
    coinY.set(startCoinY)
    pointerRef.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startCoinX,
      startCoinY,
      dragged: false,
      mode: 'pending',
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleCoinPointerMove = (event: React.PointerEvent<HTMLSpanElement>) => {
    const interaction = pointerRef.current
    if (interaction.id !== event.pointerId) return

    const maxPull = isBig ? 140 : 86
    const maxLift = isBig ? 150 : 52
    const pointerDistanceX = event.clientX - interaction.startX
    const pointerDistanceY = event.clientY - interaction.startY

    if (interaction.mode === 'pending') {
      const distance = Math.hypot(pointerDistanceX, pointerDistanceY)
      if (distance > 6) {
        interaction.mode = Math.abs(pointerDistanceY) > Math.abs(pointerDistanceX)
          ? 'vertical'
          : 'horizontal'
        interaction.dragged = true
        elevationRef.current = interaction.mode === 'vertical'
        if (interaction.mode === 'horizontal') {
          coinY.set(0)
          syncElevationVisuals(0)
        }
      }
    }

    if (interaction.mode === 'vertical') {
      coinY.set(clamp(
        interaction.startCoinY + pointerDistanceY,
        -maxLift,
        0,
      ))
      coinX.set(0)
      return
    }

    if (interaction.mode === 'horizontal') {
      coinX.set(clamp(
        interaction.startCoinX + pointerDistanceX,
        -maxPull,
        maxPull,
      ))
    }
  }

  const handleCoinPointerUp = (event: React.PointerEvent<HTMLSpanElement>) => {
    const interaction = pointerRef.current
    if (interaction.id !== event.pointerId) return

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    pointerRef.current.id = -1

    if (interaction.mode === 'vertical' && coinY.get() < -4) {
      dropCoin(coinY.get())
    } else if (interaction.dragged && Math.abs(coinX.get()) > 4) {
      launchSlingshot(coinX.get())
    } else {
      requestMotionAccess()
      replayAnimation()
    }
  }

  const containerClassName = [
    styles.container,
    isBig ? styles.logoBig : '',
  ].filter(Boolean).join(' ')

  const coinClassName = [
    styles.coin,
  ].filter(Boolean).join(' ')

  return (
    <div
      ref={containerRef}
      className={containerClassName}
      style={style}
      role="group"
      aria-label="My Money"
    >
      {isBig && <span className={styles.spotlight} aria-hidden="true" />}

      <motion.span
        ref={mLetterRef}
        className={styles.letter}
        aria-hidden="true"
        style={{ x: mPosition }}
      >
        M
      </motion.span>

      <motion.span
        ref={coinStageRef}
        className={styles.coinStage}
        style={{ x: coinX, opacity: coinOpacity }}
        role={shouldAnimate ? 'button' : undefined}
        tabIndex={shouldAnimate ? 0 : undefined}
        aria-label={shouldAnimate ? 'Tap, pull, lift, or shake the logo coin' : undefined}
        aria-hidden={shouldAnimate ? undefined : true}
        onKeyDown={shouldAnimate ? handleCoinKeyDown : undefined}
        onPointerDown={shouldAnimate ? handleCoinPointerDown : undefined}
        onPointerMove={shouldAnimate ? handleCoinPointerMove : undefined}
        onPointerUp={shouldAnimate ? handleCoinPointerUp : undefined}
        onPointerCancel={shouldAnimate ? handleCoinPointerUp : undefined}
      >
        <motion.span
          ref={coinRef}
          className={coinClassName}
          style={{ y: coinY, rotate: coinRotation, scale: coinScale }}
        >
          <MetalCoinArtwork />
          <span className={styles.coinText}>ONE</span>
          <span
            key={replayKey}
            className={shouldAnimate
              ? `${styles.coinLighting} ${styles.coinLightingAnimated}`
              : styles.coinLighting}
          />
        </motion.span>

        {isBig && (
          <>
            <motion.span
              className={styles.reflectionFrame}
              style={{
                opacity: reflectionOpacity,
                scaleX: reflectionScaleX,
                scaleY: reflectionScaleY,
                y: reflectionY,
              }}
            >
              <motion.span
                className={`${styles.coin} ${styles.reflectionCoin}`}
                style={{ rotate: coinRotation, scaleY: -1 }}
              >
                <MetalCoinArtwork />
                <span className={styles.coinText}>ONE</span>
              </motion.span>
            </motion.span>
            <motion.span
              className={styles.contactShadow}
              style={{
                opacity: shadowOpacity,
                scaleX: shadowScaleX,
                scaleY: shadowScaleY,
              }}
            />
          </>
        )}
      </motion.span>

      <motion.span
        className={styles.letter}
        aria-hidden="true"
        style={{ x: yPosition }}
      >
        Y
      </motion.span>
    </div>
  )
}
