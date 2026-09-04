'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { AnyBlock } from '@repo/types'
import { Copy, GripVertical, Trash2 } from 'lucide-react'
import { BLOCK_LABELS } from './block-defaults'

interface SortableBlockItemProps {
  block: AnyBlock
  selected: boolean
  onSelect: () => void
  onDuplicate: () => void
  onRemove: () => void
}

export function SortableBlockItem({
  block,
  selected,
  onSelect,
  onDuplicate,
  onRemove,
}: SortableBlockItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      onClick={onSelect}
      className={`flex items-center gap-2 rounded-lg border bg-white px-3 py-2.5 cursor-pointer ${
        selected ? 'border-indigo-400 ring-1 ring-indigo-200' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing"
        aria-label="드래그하여 순서 변경"
      >
        <GripVertical size={16} />
      </button>
      <span className="flex-1 text-sm font-medium text-gray-800">{BLOCK_LABELS[block.type]}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onDuplicate()
        }}
        className="text-gray-400 hover:text-indigo-600"
        aria-label="복제"
      >
        <Copy size={15} />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="text-gray-400 hover:text-red-500"
        aria-label="삭제"
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}
