'use client'

import type { BlockType } from '@repo/types'
import { Plus } from 'lucide-react'
import { BLOCK_LABELS } from './block-defaults'

interface BlockPaletteProps {
  slot: string
  slotLabel: string
  allowedBlockTypes: BlockType[]
  onAdd: (type: BlockType, slot: string) => void
}

export function BlockPalette({ slot, slotLabel, allowedBlockTypes, onAdd }: BlockPaletteProps) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
        {slotLabel}
      </p>
      <div className="flex flex-wrap gap-2">
        {allowedBlockTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onAdd(type, slot)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-indigo-300 hover:text-indigo-600"
          >
            <Plus size={14} />
            {BLOCK_LABELS[type]}
          </button>
        ))}
      </div>
    </div>
  )
}
