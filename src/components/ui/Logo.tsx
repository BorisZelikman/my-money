import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useReducedMotion } from 'framer-motion'
import styles from './Logo.module.css'

interface LogoProps {
  style?: React.CSSProperties
  isBig?: boolean
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
  const coinDiameterRef = useRef(isBig ? 84 : 44)
  const insertionDistanceRef = useRef(isBig ? 100 : 56)
  const movementRef = useRef<{ stop: () => void } | null>(null)
  const appearanceRef = useRef<{ stop: () => void } | null>(null)
  const animationRunRef = useRef(0)
  const slingshotRef = useRef(false)
  const shotDirectionRef = useRef<-1 | 1>(-1)
  const pointerRef = useRef({
    id: -1,
    startX: 0,
    startCoinX: 0,
    dragged: false,
  })
  const [replayKey, setReplayKey] = useState(0)

  const coinX = useMotionValue(shouldAnimate ? coinTravel : 0)
  const coinRotation = useMotionValue(0)
  const coinOpacity = useMotionValue(shouldAnimate ? 0 : 1)
  const mPosition = useMotionValue(0)
  const yPosition = useMotionValue(shouldAnimate ? -insertionDistanceRef.current : 0)

  const syncLettersWithCoin = useCallback((position: number) => {
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

      const position = coinX.get()
      const circumference = Math.PI * coinDiameterRef.current
      coinRotation.set((position / circumference) * 360)
      if (shouldAnimate) {
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
  }, [coinRotation, coinX, mPosition, shouldAnimate, syncLettersWithCoin, yPosition])

  const playInitialAnimation = useCallback(() => {
    if (!shouldAnimate) {
      coinX.set(0)
      coinRotation.set(0)
      coinOpacity.set(1)
      mPosition.set(0)
      yPosition.set(0)
      return
    }

    movementRef.current?.stop()
    appearanceRef.current?.stop()
    animationRunRef.current += 1
    slingshotRef.current = false
    pointerRef.current.id = -1

    coinX.set(coinTravel)
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
  }, [coinOpacity, coinRotation, coinTravel, coinX, mPosition, shouldAnimate, yPosition])

  const replayAnimation = useCallback(() => {
    if (!shouldAnimate) return

    movementRef.current?.stop()
    appearanceRef.current?.stop()
    slingshotRef.current = false
    pointerRef.current.id = -1

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
  }, [coinOpacity, coinTravel, coinX, shouldAnimate])

  const launchSlingshot = useCallback((pullPosition: number) => {
    if (!shouldAnimate) return

    movementRef.current?.stop()
    appearanceRef.current?.stop()

    const runId = animationRunRef.current + 1
    animationRunRef.current = runId
    slingshotRef.current = true
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
  }, [coinOpacity, coinX, isBig, mPosition, shouldAnimate, syncLettersWithCoin, yPosition])

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

    playInitialAnimation()

    return () => {
      movementRef.current?.stop()
      appearanceRef.current?.stop()
      unsubscribe()
    }
  }, [coinRotation, coinX, playInitialAnimation, shouldAnimate, syncLettersWithCoin])

  const handleCoinKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      replayAnimation()
    }
  }

  const handleCoinPointerDown = (event: React.PointerEvent<HTMLSpanElement>) => {
    if (!shouldAnimate || event.button !== 0) return

    movementRef.current?.stop()
    appearanceRef.current?.stop()
    animationRunRef.current += 1
    slingshotRef.current = false
    coinOpacity.set(1)

    const maxPull = isBig ? 140 : 86
    const startCoinX = clamp(coinX.get(), -maxPull, maxPull)
    coinX.set(startCoinX)
    pointerRef.current = {
      id: event.pointerId,
      startX: event.clientX,
      startCoinX,
      dragged: false,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleCoinPointerMove = (event: React.PointerEvent<HTMLSpanElement>) => {
    const interaction = pointerRef.current
    if (interaction.id !== event.pointerId) return

    const maxPull = isBig ? 140 : 86
    const pointerDistance = event.clientX - interaction.startX
    const nextPosition = clamp(
      interaction.startCoinX + pointerDistance,
      -maxPull,
      maxPull,
    )
    if (Math.abs(pointerDistance) > 4) interaction.dragged = true
    coinX.set(nextPosition)
  }

  const handleCoinPointerUp = (event: React.PointerEvent<HTMLSpanElement>) => {
    const interaction = pointerRef.current
    if (interaction.id !== event.pointerId) return

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    pointerRef.current.id = -1

    if (interaction.dragged && Math.abs(coinX.get()) > 4) {
      launchSlingshot(coinX.get())
    } else {
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
        aria-label={shouldAnimate ? 'Tap or pull the logo coin in either direction' : undefined}
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
          style={{ rotate: coinRotation }}
        >
          <MetalCoinArtwork />
          <span className={styles.coinText}>ONE</span>
        </motion.span>

        <span
          key={replayKey}
          className={shouldAnimate
            ? `${styles.coinLighting} ${styles.coinLightingAnimated}`
            : styles.coinLighting}
        />

        {isBig && (
          <>
            <span className={styles.reflectionFrame}>
              <motion.span
                className={`${styles.coin} ${styles.reflectionCoin}`}
                style={{ rotate: coinRotation, scaleY: -1 }}
              >
                <MetalCoinArtwork />
                <span className={styles.coinText}>ONE</span>
              </motion.span>
            </span>
            <span className={styles.contactShadow} />
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
