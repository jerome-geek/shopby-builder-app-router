'use client'

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  PAGE_POLICIES,
  resolveBlockSlot,
  validatePageSchemaForType,
  type AnyBlock,
  type Block,
  type PageType,
  type VersionedPageSchema,
} from '@repo/types'
import { AlertTriangle, Check, Eye, Loader2, PencilLine, Rocket } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { publishPage, saveDraft } from '@/app/dashboard/actions'
import { BlockPalette } from './BlockPalette'
import { createDefaultBlock, duplicateBlock } from './block-defaults'
import { BuilderPreview } from './BuilderPreview'
import { PropertyPanel } from './PropertyPanel'
import { SortableBlockItem } from './SortableBlockItem'

const AUTOSAVE_DEBOUNCE_MS = 1500

type SaveStatus = 'idle' | 'saving' | 'saved' | 'conflict' | 'invalid' | 'error'
type PublishStatus = 'idle' | 'publishing' | 'published' | 'conflict' | 'invalid' | 'error'

const SLOT_LABELS: Record<string, string> = {
  main: '본문',
  productListUpper: '상품 목록 상단',
  productListLower: '상품 목록 하단',
  productDetailUpper: '상품 상세 상단',
  productDetailLower: '상품 상세 하단',
}

interface PageBuilderProps {
  pageId: string
  pageType: PageType
  initialSchema: VersionedPageSchema
  initialUpdatedAt: string
  initialPublishedAt: string | null
}

export function PageBuilder({
  pageId,
  pageType,
  initialSchema,
  initialUpdatedAt,
  initialPublishedAt,
}: PageBuilderProps) {
  const policy = PAGE_POLICIES[pageType]
  const [blocks, setBlocks] = useState<AnyBlock[]>(initialSchema.blocks as AnyBlock[])
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [saveIssues, setSaveIssues] = useState<string[]>([])
  const [publishStatus, setPublishStatus] = useState<PublishStatus>('idle')
  const [publishIssues, setPublishIssues] = useState<string[]>([])
  const [publishedAt, setPublishedAt] = useState(initialPublishedAt)
  const expectedUpdatedAtRef = useRef(initialUpdatedAt)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const blocksBySlot = useMemo(() => {
    const map = new Map<string, AnyBlock[]>()
    for (const slot of Object.keys(policy.slots)) map.set(slot, [])
    for (const block of blocks) {
      const slot = resolveBlockSlot(block)
      const list = map.get(slot)
      if (list) list.push(block)
    }
    for (const list of map.values()) list.sort((a, b) => a.order - b.order)
    return map
  }, [blocks, policy])

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) ?? null

  const validation = useMemo(
    () => validatePageSchemaForType(pageType, { schemaVersion: initialSchema.schemaVersion, blocks }),
    [pageType, initialSchema.schemaVersion, blocks]
  )

  // Debounced autosave: skips the very first render (that's just the
  // initial load, nothing to save) and stops firing once a conflict is
  // hit — an editor that lost the optimistic-concurrency race must not
  // keep quietly retrying and eventually clobber someone else's save.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (saveStatus === 'conflict') return
    if (!validation.valid) {
      setSaveStatus('invalid')
      setSaveIssues(validation.issues.map((issue) => issue.message))
      return
    }

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus('saving')
      const schema: VersionedPageSchema = { schemaVersion: initialSchema.schemaVersion, blocks }
      const result = await saveDraft(pageId, schema, expectedUpdatedAtRef.current)

      if (result.status === 'saved') {
        expectedUpdatedAtRef.current = result.updatedAt!
        setSaveStatus('saved')
      } else if (result.status === 'conflict') {
        setSaveStatus('conflict')
      } else if (result.status === 'invalid') {
        setSaveStatus('invalid')
        setSaveIssues(result.issues ?? [])
      } else {
        setSaveStatus('error')
      }
    }, AUTOSAVE_DEBOUNCE_MS)

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks])

  async function handlePublish() {
    if (!validation.valid) {
      setPublishStatus('invalid')
      setPublishIssues(validation.issues.map((issue) => issue.message))
      return
    }

    // Cancel any pending autosave — publish saves the current state
    // itself, atomically with creating the revision, so a debounced
    // autosave landing in between would just be redundant.
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)

    setPublishStatus('publishing')
    const schema: VersionedPageSchema = { schemaVersion: initialSchema.schemaVersion, blocks }
    const result = await publishPage(pageId, schema, expectedUpdatedAtRef.current)

    if (result.status === 'published') {
      expectedUpdatedAtRef.current = result.updatedAt!
      setPublishedAt(result.publishedAt!)
      setPublishStatus('published')
      setSaveStatus('saved')
    } else if (result.status === 'conflict') {
      setPublishStatus('conflict')
    } else if (result.status === 'invalid') {
      setPublishStatus('invalid')
      setPublishIssues(result.issues ?? [])
    } else {
      setPublishStatus('error')
    }
  }

  function addBlock(type: Parameters<typeof createDefaultBlock>[0], slot: string) {
    const order = (blocksBySlot.get(slot)?.length ?? 0)
    const block = createDefaultBlock(type, order, slot) as AnyBlock
    setBlocks((prev) => [...prev, block])
    setSelectedBlockId(block.id)
  }

  function removeBlockById(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id))
    if (selectedBlockId === id) setSelectedBlockId(null)
  }

  function duplicateBlockById(id: string) {
    const source = blocks.find((b) => b.id === id)
    if (!source) return
    const slot = resolveBlockSlot(source)
    const order = (blocksBySlot.get(slot)?.length ?? 0)
    const copy = duplicateBlock(source, order) as AnyBlock
    setBlocks((prev) => [...prev, copy])
    setSelectedBlockId(copy.id)
  }

  function updateSelectedBlockProps(props: Block['props']) {
    if (!selectedBlockId) return
    setBlocks((prev) =>
      prev.map((b) => (b.id === selectedBlockId ? ({ ...b, props } as AnyBlock) : b))
    )
  }

  function handleDragEnd(slot: string, event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const slotBlocks = blocksBySlot.get(slot) ?? []
    const oldIndex = slotBlocks.findIndex((b) => b.id === active.id)
    const newIndex = slotBlocks.findIndex((b) => b.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(slotBlocks, oldIndex, newIndex).map((b, index) => ({
      ...b,
      order: index,
    }))
    const reorderedIds = new Set(reordered.map((b) => b.id))

    setBlocks((prev) => [...prev.filter((b) => !reorderedIds.has(b.id)), ...reordered] as AnyBlock[])
  }

  if (!policy.editable) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-10 text-center text-gray-500">
        <p className="font-medium">'{pageType}' 페이지는 고정 시스템 템플릿입니다.</p>
        <p className="text-sm mt-1">블록을 자유롭게 배치할 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex rounded-lg border border-gray-200 p-0.5 bg-white">
          <button
            type="button"
            onClick={() => setMode('edit')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${
              mode === 'edit' ? 'bg-indigo-600 text-white' : 'text-gray-600'
            }`}
          >
            <PencilLine size={14} />
            편집
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${
              mode === 'preview' ? 'bg-indigo-600 text-white' : 'text-gray-600'
            }`}
          >
            <Eye size={14} />
            미리보기
          </button>
        </div>
        <div className="flex items-center gap-4">
          <SaveStatusIndicator status={saveStatus} issueCount={saveIssues.length} />
          {publishedAt && (
            <span className="text-xs text-gray-400">
              최근 게시 {new Date(publishedAt).toLocaleString('ko-KR')}
            </span>
          )}
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishStatus === 'publishing'}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            {publishStatus === 'publishing' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Rocket size={14} />
            )}
            게시
          </button>
        </div>
      </div>

      {publishStatus === 'conflict' && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center justify-between">
          <span>다른 곳에서 이 페이지가 먼저 저장되어 게시가 취소되었습니다. 새로고침 후 다시 시도해주세요.</span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="ml-4 shrink-0 rounded-md bg-amber-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-amber-700"
          >
            새로고침
          </button>
        </div>
      )}
      {publishStatus === 'invalid' && publishIssues.length > 0 && (
        <ul className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 list-disc list-inside">
          {publishIssues.map((issue, i) => (
            <li key={i}>게시 실패: {issue}</li>
          ))}
        </ul>
      )}
      {publishStatus === 'error' && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          게시 중 오류가 발생했습니다. 다시 시도해주세요.
        </div>
      )}

      {saveStatus === 'conflict' && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center justify-between">
          <span>다른 곳에서 이 페이지가 먼저 저장되어 자동저장이 중단되었습니다. 새로고침하면 최신 내용을 볼 수 있습니다 (지금까지의 편집 내용은 저장되지 않습니다).</span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="ml-4 shrink-0 rounded-md bg-amber-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-amber-700"
          >
            새로고침
          </button>
        </div>
      )}
      {saveStatus === 'invalid' && saveIssues.length > 0 && (
        <ul className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 list-disc list-inside">
          {saveIssues.map((issue, i) => (
            <li key={i}>{issue}</li>
          ))}
        </ul>
      )}

      {mode === 'preview' ? (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {Array.from(blocksBySlot.entries()).map(([slot, slotBlocks]) => (
            <div key={slot}>
              <p className="bg-gray-50 px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                {SLOT_LABELS[slot] ?? slot}
              </p>
              <BuilderPreview blocks={slotBlocks} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-[1fr_320px] gap-4 items-start">
          <div className="space-y-6">
            {Array.from(blocksBySlot.entries()).map(([slot, slotBlocks]) => (
              <div key={slot} className="space-y-3">
                <BlockPalette
                  slot={slot}
                  slotLabel={SLOT_LABELS[slot] ?? slot}
                  allowedBlockTypes={policy.slots[slot]?.allowedBlockTypes ?? []}
                  onAdd={addBlock}
                />
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleDragEnd(slot, event)}
                >
                  <SortableContext
                    items={slotBlocks.map((b) => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {slotBlocks.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400">
                          이 영역에 블록이 없습니다.
                        </div>
                      ) : (
                        slotBlocks.map((block) => (
                          <SortableBlockItem
                            key={block.id}
                            block={block}
                            selected={block.id === selectedBlockId}
                            onSelect={() => setSelectedBlockId(block.id)}
                            onDuplicate={() => duplicateBlockById(block.id)}
                            onRemove={() => removeBlockById(block.id)}
                          />
                        ))
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            ))}
          </div>

          <div className="sticky top-4 rounded-xl border border-gray-200 bg-white p-4">
            {selectedBlock ? (
              <>
                <p className="text-sm font-semibold text-gray-800 mb-3">블록 속성</p>
                <PropertyPanel block={selectedBlock} onChange={updateSelectedBlockProps} />
              </>
            ) : (
              <p className="text-sm text-gray-400">블록을 선택하면 속성을 편집할 수 있습니다.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SaveStatusIndicator({ status, issueCount }: { status: SaveStatus; issueCount: number }) {
  switch (status) {
    case 'saving':
      return (
        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
          <Loader2 size={12} className="animate-spin" />
          저장 중...
        </span>
      )
    case 'saved':
      return (
        <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
          <Check size={12} />
          저장됨
        </span>
      )
    case 'conflict':
      return (
        <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
          <AlertTriangle size={12} />
          충돌 발생
        </span>
      )
    case 'invalid':
      return (
        <span className="flex items-center gap-1.5 text-xs font-medium text-red-500">
          <AlertTriangle size={12} />
          {issueCount}개 유효성 오류 (저장 안 됨)
        </span>
      )
    case 'error':
      return (
        <span className="flex items-center gap-1.5 text-xs font-medium text-red-500">
          <AlertTriangle size={12} />
          저장 실패
        </span>
      )
    default:
      return null
  }
}
