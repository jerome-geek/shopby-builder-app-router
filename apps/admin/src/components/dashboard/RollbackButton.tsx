'use client'

import { rollbackToRevision } from '@/app/dashboard/actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function RollbackButton({ pageId, revisionId }: { pageId: string; revisionId: string }) {
  const [pending, setPending] = useState(false)
  const router = useRouter()

  async function handleClick() {
    if (
      !window.confirm(
        '이 버전으로 되돌리시겠습니까? 현재 게시된 내용과 편집 중인 초안이 모두 이 버전으로 대체됩니다.'
      )
    ) {
      return
    }

    setPending(true)
    const result = await rollbackToRevision(pageId, revisionId)
    setPending(false)

    if (result.status === 'rolled_back') {
      router.push(`/dashboard/pages/${pageId}/edit`)
      router.refresh()
    } else {
      window.alert('되돌리기에 실패했습니다.')
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-60"
    >
      {pending ? '되돌리는 중...' : '이 버전으로 되돌리기'}
    </button>
  )
}
