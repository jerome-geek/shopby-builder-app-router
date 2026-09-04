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
      </label>
      <label className="block text-xs font-medium text-gray-500">
        ShopBy Mall ID
        <input
          name="mallId"
          required
          className="mt-1 w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none"
        />
      </label>
      <label className="block text-xs font-medium text-gray-500">
        ShopBy API Key
        <input
          name="apiKey"
          required
          type="password"
          className="mt-1 w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none"
        />
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
