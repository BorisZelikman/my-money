import { useMemo, useState } from 'react'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import type { Category } from '@/types'
import styles from './CategoryTreeEditor.module.css'

const ROOT_DROP_ID = 'category-tree-root'
const INDENTATION_WIDTH = 32

interface TreeItem {
  category: Category
  depth: number
}

interface CategoryTreeEditorProps {
  categories: Category[]
  disabled?: boolean
  onChange: (categories: Category[]) => Promise<void>
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

function sortSiblings(first: Category, second: Category) {
  return first.sortOrder - second.sortOrder || first.title.localeCompare(second.title)
}

function flattenTree(categories: Category[]): TreeItem[] {
  const result: TreeItem[] = []
  const visited = new Set<string>()
  const append = (parentCategoryId: string | null, depth: number) => {
    categories
      .filter((category) => category.parentCategoryId === parentCategoryId)
      .sort(sortSiblings)
      .forEach((category) => {
        if (visited.has(category.id)) return
        visited.add(category.id)
        result.push({ category, depth })
        append(category.id, depth + 1)
      })
  }
  append(null, 0)
  categories.filter((category) => !visited.has(category.id)).sort(sortSiblings)
    .forEach((category) => result.push({ category, depth: 0 }))
  return result
}

function getDescendantIds(categoryId: string, categories: Category[]) {
  const descendants = new Set<string>()
  const visit = (parentId: string) => {
    categories.filter((category) => category.parentCategoryId === parentId)
      .forEach((category) => {
        if (descendants.has(category.id)) return
        descendants.add(category.id)
        visit(category.id)
      })
  }
  visit(categoryId)
  return descendants
}

function moveCategory(
  categories: Category[],
  activeId: string,
  overId: string,
  horizontalDelta: number
) {
  const active = categories.find((category) => category.id === activeId)
  if (!active) return categories

  const over = overId === ROOT_DROP_ID
    ? null
    : categories.find((category) => category.id === overId) || null
  let parentCategoryId: string | null
  if (!over) {
    parentCategoryId = null
  } else if (horizontalDelta >= INDENTATION_WIDTH) {
    parentCategoryId = over.id
  } else if (horizontalDelta <= -INDENTATION_WIDTH) {
    parentCategoryId = null
  } else {
    parentCategoryId = over.parentCategoryId
  }

  const descendants = getDescendantIds(active.id, categories)
  if (parentCategoryId === active.id || (parentCategoryId && descendants.has(parentCategoryId))) {
    return categories
  }

  const grouped = new Map<string, Category[]>()
  const groupKey = (parentId: string | null) => parentId || ROOT_DROP_ID
  categories.filter((category) => category.id !== active.id).forEach((category) => {
    const key = groupKey(category.parentCategoryId)
    grouped.set(key, [...(grouped.get(key) || []), category])
  })
  grouped.forEach((siblings, key) => grouped.set(key, siblings.sort(sortSiblings)))

  const targetKey = groupKey(parentCategoryId)
  const targetSiblings = grouped.get(targetKey) || []
  const targetIndex = over && over.parentCategoryId === parentCategoryId
    ? Math.max(0, targetSiblings.findIndex((category) => category.id === over.id))
    : targetSiblings.length
  targetSiblings.splice(targetIndex, 0, { ...active, parentCategoryId })
  grouped.set(targetKey, targetSiblings)

  const nextById = new Map<string, Category>()
  grouped.forEach((siblings) => siblings.forEach((category, index) => {
    nextById.set(category.id, { ...category, sortOrder: index })
  }))
  return categories.map((category) => nextById.get(category.id) || category)
}

function RootDropZone({ active }: { active: boolean }) {
  const { isOver, setNodeRef } = useDroppable({ id: ROOT_DROP_ID })
  return (
    <div
      ref={setNodeRef}
      className={`${styles.rootDropZone} ${active ? styles.rootDropZoneActive : ''} ${
        isOver ? styles.rootDropZoneOver : ''
      }`}
    >
      Root categories
    </div>
  )
}

interface CategoryTreeRowProps {
  item: TreeItem
  disabled: boolean
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

function CategoryTreeRow({ item, disabled, onEdit, onDelete }: CategoryTreeRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.category.id,
    disabled,
  })
  return (
    <div
      ref={setNodeRef}
      className={`${styles.row} ${isDragging ? styles.dragging : ''}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        marginInlineStart: `${item.depth * 1.5}rem`,
      }}
    >
      <button
        type="button"
        className={styles.dragHandle}
        {...attributes}
        {...listeners}
        disabled={disabled}
        aria-label={`Move ${item.category.title}`}
        title="Drag vertically to reorder, right to nest, or left to move to root"
      >
        <GripVertical aria-hidden="true" />
      </button>
      <div className={styles.nodeContent}>
        <span className={styles.nodeTitle}>{item.category.title}</span>
        <span className={styles.nodeType}>{item.category.type}</span>
      </div>
      <button
        type="button"
        className={styles.actionButton}
        onClick={() => onEdit(item.category)}
        disabled={disabled}
        aria-label={`Edit ${item.category.title}`}
        title="Edit category"
      >
        <Pencil aria-hidden="true" />
      </button>
      <button
        type="button"
        className={`${styles.actionButton} ${styles.deleteButton}`}
        onClick={() => onDelete(item.category)}
        disabled={disabled}
        aria-label={`Delete ${item.category.title}`}
        title="Delete category"
      >
        <Trash2 aria-hidden="true" />
      </button>
    </div>
  )
}

export function CategoryTreeEditor({
  categories,
  disabled = false,
  onChange,
  onEdit,
  onDelete,
}: CategoryTreeEditorProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const flattened = useMemo(() => flattenTree(categories), [categories])
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id))
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    if (!event.over) return
    const nextCategories = moveCategory(
      categories,
      String(event.active.id),
      String(event.over.id),
      event.delta.x
    )
    if (nextCategories.some((category, index) => category !== categories[index])) {
      void onChange(nextCategories)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={handleDragEnd}
    >
      <RootDropZone active={activeId !== null} />
      <SortableContext
        items={flattened.map((item) => item.category.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={styles.tree}>
          {flattened.map((item) => (
            <CategoryTreeRow
              key={item.category.id}
              item={item}
              disabled={disabled}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
