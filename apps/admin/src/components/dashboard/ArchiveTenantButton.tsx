'use client'

import { archiveTenant } from '@/app/dashboard/actions'

export function ArchiveTenantButton({ tenantId }: { tenantId: string }) {
  return (
    <form
      action={archiveTenant}
      onSubmit={(e) => {
        if (!window.confirm('이 쇼핑몰을 보관 처리하시겠습니까? 목록에서 숨겨집니다.')) {
          e.preventDefault()
        }
      }}
    >
      <input type="hidden" name="tenantId" value={tenantId} />
      <button type="submit" className="text-sm font-medium text-red-500 hover:underline">
        쇼핑몰 보관
      </button>
    </form>
  )
}
