'use client'

import { useActionState } from 'react'
import { createTenant, type ActionState } from '@/app/dashboard/actions'

const initialState: ActionState = {}

export function CreateTenantForm() {
  const [state, action, pending] = useActionState(createTenant, initialState)

  return (
    <form action={action} className="space-y-4 max-w-sm">
      <label className="block text-xs font-medium text-gray-500">
        서브도메인
        <input
          name="subdomain"
          required
          placeholder="my-shop"
          pattern="[a-z0-9][a-z0-9-]*[a-z0-9]"
          className="mt-1 w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none"
        />
        <span className="mt-1 block text-[11px] font-normal text-gray-400">
          이 쇼핑몰의 접속 주소가 됨 (예: my-shop → my-shop.도메인). 영문 소문자/숫자/하이픈만,
          www·admin·app·api·auth·dashboard는 예약어라 사용 불가.
        </span>
      </label>
      <label className="block text-xs font-medium text-gray-500">
        ShopBy Client ID
        <input
          name="clientId"
          required
          placeholder="예: test-client-id"
          className="mt-1 w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none"
        />
        <span className="mt-1 block text-[11px] font-normal text-gray-400">
          ShopBy Shop API 호출 시 clientId 헤더로 그대로 전송되는 쇼핑몰 클라이언트 아이디.
          ShopBy 파트너센터 → Open API 관리에서 확인.
        </span>
      </label>
      <label className="block text-xs font-medium text-gray-500">
        ShopBy API Key
        <input
          name="apiKey"
          required
          type="password"
          className="mt-1 w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none"
        />
        <span className="mt-1 block text-[11px] font-normal text-gray-400">
          Shop API 조회에는 안 쓰임 — 이후 Server API(주문 처리 등) 연동 시 쓸 시크릿. 지금은
          형식 확인용으로만 저장됨, 저장 후에는 다시 표시되지 않음.
        </span>
      </label>
      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60"
      >
        {pending ? '생성 중...' : '쇼핑몰 생성'}
      </button>
    </form>
  )
}
