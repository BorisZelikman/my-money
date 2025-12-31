import styles from './Skeleton.module.css'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  className?: string
}

export function Skeleton({
  width,
  height,
  variant = 'text',
  className = '',
}: SkeletonProps) {
  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }

  return (
    <div
      className={`${styles.skeleton} ${styles[variant]} ${className}`}
      style={style}
    />
  )
}

// Pre-built skeleton components for common use cases

export function SkeletonCard() {
  return (
    <div className={styles.card}>
      <Skeleton variant="rounded" height={20} width="60%" />
      <Skeleton variant="text" height={16} />
      <Skeleton variant="text" height={16} width="80%" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className={styles.row}>
      <Skeleton variant="text" width={80} />
      <Skeleton variant="text" width="40%" />
      <Skeleton variant="text" width={60} />
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className={styles.table}>
      <div className={styles.tableHeader}>
        <Skeleton variant="text" width={80} />
        <Skeleton variant="text" width="30%" />
        <Skeleton variant="text" width={100} />
        <Skeleton variant="text" width={80} />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  )
}

export function SkeletonList({ items = 3 }: { items?: number }) {
  return (
    <div className={styles.list}>
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

