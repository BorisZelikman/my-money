import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SwipeableItem } from './SwipeableItem'
import styles from './SortableList.module.css'

interface SortableItemProps {
  id: string
  children: React.ReactNode
  disabled?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

function SortableItem({ id, children, disabled, onEdit, onDelete }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const content = (
    <div className={styles.innerContent}>
      {!disabled && (
        <button
          className={styles.dragHandle}
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <span className={styles.gripIcon}>⋮⋮</span>
        </button>
      )}
      <div className={styles.content}>{children}</div>
    </div>
  )

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.item} ${isDragging ? styles.dragging : ''}`}
    >
      {(onEdit || onDelete) ? (
        <SwipeableItem onEdit={onEdit} onDelete={onDelete} disabled={isDragging}>
          {content}
        </SwipeableItem>
      ) : (
        content
      )}
    </div>
  )
}

interface SortableListProps<T extends { id: string }> {
  items: T[]
  onReorder: (items: T[]) => void
  renderItem: (item: T, index: number) => React.ReactNode
  disabled?: boolean
  onEditItem?: (item: T) => void
  onDeleteItem?: (item: T) => void
}

export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  disabled = false,
  onEditItem,
  onDeleteItem,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)
      const newItems = arrayMove(items, oldIndex, newIndex)
      onReorder(newItems)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={styles.list}>
          {items.map((item, index) => (
            <SortableItem 
              key={item.id} 
              id={item.id} 
              disabled={disabled}
              onEdit={onEditItem ? () => onEditItem(item) : undefined}
              onDelete={onDeleteItem ? () => onDeleteItem(item) : undefined}
            >
              {renderItem(item, index)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
