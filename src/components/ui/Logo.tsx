import { useState } from 'react'
import { motion } from 'framer-motion'
import styles from './Logo.module.css'

interface LogoProps {
  style?: React.CSSProperties
  isBig?: boolean
}

export function Logo({ style, isBig = false }: LogoProps) {
  const [rotate, setRotate] = useState(true)

  return (
    <div className={isBig ? `${styles.container} ${styles.fontBig}` : styles.container} style={style}>
      <span className={styles.letter}>M</span>
      <motion.p
        className={styles.letter}
        animate={{ x: isBig ? 92 : 50 }}
        transition={{
          repeat: isBig ? Infinity : 0,
          repeatType: isBig ? 'reverse' : 'loop',
          repeatDelay: 0.7,
          delay: isBig ? 0.9 : 1,
          duration: isBig ? 0.5 : 0.4,
          type: 'tween',
          ease: 'easeIn',
        }}
        initial={{ x: 0 }}
      >
        Y
      </motion.p>
      <motion.div
        onClick={() => setRotate(!rotate)}
        animate={{ x: isBig ? -22 : -15, rotate: rotate ? 360 : 0 }}
        transition={{
          repeat: isBig ? Infinity : 0,
          repeatType: isBig ? 'reverse' : 'loop',
          repeatDelay: 0.2,
          delay: 0.4,
          type: 'tween',
          duration: 1,
          ease: 'easeIn',
        }}
        initial={{ x: -300 }}
        className={isBig ? `${styles.coin} ${styles.coinBig}` : styles.coin}
      >
        ONE
      </motion.div>
    </div>
  )
}

