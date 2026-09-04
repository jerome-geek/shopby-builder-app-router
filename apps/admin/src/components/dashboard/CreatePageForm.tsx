'use client'

import { useActionState } from 'react'
import { createPage, type ActionState } from '@/app/dashboard/actions'

const initialState: ActionState = {}

const PAGE_TYPE_LABELS: Record<string, string> = {
  home: '홈',
  category: '카테고리/기획전',
  product: '상품 상세',
  cart: '장바구니/주문서',
  mypage: '마이페이지',
}

export function CreatePageForm({ tenantId }: { tenantId: string }) {
  const [state, action, pending] = useActionState(createPage, initialState)

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="tenantId" value={tenantId} />
      <label className="text-xs font-medium text-gray-500">
        슬러그
        <input
          name="slug"
          required
          placeholder="/about"
          className="mt-1 block w-36 rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none"
        />
      </label>
      <label className="text-xs font-medium text-gray-500">
        제목
        <input
          name="title"
          required
          className="mt-1 block w-40 rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none"
        />
      </label>
      <label className="text-xs font-medium text-gray-500">
        유형
        <select
          name="pageType"
          defaultValue="home"
          className="mt-1 block w-36 rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none"
        >
          {Object.entries(PAGE_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60"
      >
        {pending ? '생성 중...' : '페이지 추가'}
      </button>
      {state.error && <p className="w-full text-sm text-red-500">{state.error}</p>}
    </form>
  )
}
