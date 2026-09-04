'use client'

import { archivePage } from '@/app/dashboard/actions'

export function ArchivePageButton({ pageId, tenantId }: { pageId: string; tenantId: string }) {
  return (
    <form
      action={archivePage}
      onSubmit={(e) => {
        if (!window.confirm('이 페이지를 보관 처리하시겠습니까?')) {
          e.preventDefault()
        }
      }}
    >
      <input type="hidden" name="pageId" value={pageId} />
      <input type="hidden" name="tenantId" value={tenantId} />
      <button type="submit" className="text-sm text-gray-400 hover:text-red-500">
        보관
      </button>
    </form>
  )
}
