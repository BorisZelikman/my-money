import { useState, useRef, type ReactNode } from 'react'
import styles from './SwipeableItem.module.css'

interface SwipeableItemProps {
  children: ReactNode
  onEdit?: () => void
  onDelete?: () => void
  disabled?: boolean
}

const SWIPE_THRESHOLD = 60
const ACTION_WIDTH = 80

export function SwipeableItem({ 
  children, 
  onEdit, 
  onDelete,
  disabled = false,
}: SwipeableItemProps) {
  const [offsetX, setOffsetX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startX = useRef(0)
  const currentX = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return
    startX.current = e.touches[0].clientX
    currentX.current = e.touches[0].clientX
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || disabled) return
    currentX.current = e.touches[0].clientX
    const diff = currentX.current - startX.current
    
    // Limit the swipe distance
    const maxSwipe = ACTION_WIDTH + 20
    const clampedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff))
    setOffsetX(clampedDiff)
  }

  const handleTouchEnd = () => {
    if (!isDragging || disabled) return
    setIsDragging(false)
    
    // Snap to action or back to center
    if (offsetX < -SWIPE_THRESHOLD && onDelete) {
      // Swiped left - show delete
      setOffsetX(-ACTION_WIDTH)
    } else if (offsetX > SWIPE_THRESHOLD && onEdit) {
      // Swiped right - show edit
      setOffsetX(ACTION_WIDTH)
    } else {
      // Snap back
      setOffsetX(0)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return
    startX.current = e.clientX
    currentX.current = e.clientX
    setIsDragging(true)
    
    const handleMouseMove = (e: MouseEvent) => {
      currentX.current = e.clientX
      const diff = currentX.current - startX.current
      const maxSwipe = ACTION_WIDTH + 20
      const clampedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff))
      setOffsetX(clampedDiff)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      
      const diff = currentX.current - startX.current
      if (diff < -SWIPE_THRESHOLD && onDelete) {
        setOffsetX(-ACTION_WIDTH)
      } else if (diff > SWIPE_THRESHOLD && onEdit) {
        setOffsetX(ACTION_WIDTH)
      } else {
        setOffsetX(0)
      }
      
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleActionClick = (action: 'edit' | 'delete') => {
    setOffsetX(0)
    if (action === 'edit' && onEdit) {
      onEdit()
    } else if (action === 'delete' && onDelete) {
      onDelete()
    }
  }

  const resetPosition = () => {
    setOffsetX(0)
  }

  return (
    <div className={styles.container} ref={containerRef}>
      {/* Edit action (left side, revealed by swiping right) */}
      {onEdit && (
        <div 
          className={`${styles.action} ${styles.editAction}`}
          style={{ opacity: offsetX > 0 ? 1 : 0 }}
        >
          <button 
            className={styles.actionButton}
            onClick={() => handleActionClick('edit')}
            aria-label="Edit"
          >
            ✏️
            <span>Edit</span>
          </button>
        </div>
      )}

      {/* Delete action (right side, revealed by swiping left) */}
      {onDelete && (
        <div 
          className={`${styles.action} ${styles.deleteAction}`}
          style={{ opacity: offsetX < 0 ? 1 : 0 }}
        >
          <button 
            className={styles.actionButton}
            onClick={() => handleActionClick('delete')}
            aria-label="Delete"
          >
            🗑️
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* Main content */}
      <div
        className={`${styles.content} ${isDragging ? styles.dragging : ''}`}
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onClick={offsetX !== 0 ? resetPosition : undefined}
      >
        {children}
      </div>
    </div>
  )
}

