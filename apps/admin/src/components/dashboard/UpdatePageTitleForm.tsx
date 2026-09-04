'use client'

import { useActionState } from 'react'
import { updatePageTitle, type ActionState } from '@/app/dashboard/actions'

const initialState: ActionState = {}

export function UpdatePageTitleForm({ pageId, title }: { pageId: string; title: string }) {
  const [state, action, pending] = useActionState(updatePageTitle, initialState)

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="pageId" value={pageId} />
      <input
        name="title"
        required
        defaultValue={title}
        className="rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-60"
      >
        {pending ? '저장 중...' : '제목 저장'}
      </button>
      {state.error && <span className="text-sm text-red-500">{state.error}</span>}
    </form>
  )
}
