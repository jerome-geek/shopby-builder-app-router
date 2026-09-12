'use client'

import { useActionState } from 'react'
import { updateTenant, type ActionState } from '@/app/dashboard/actions'

const initialState: ActionState = {}

interface TenantSettingsFormProps {
  tenantId: string
  clientId: string
  apiKey: string
}

export function TenantSettingsForm({ tenantId, clientId, apiKey }: TenantSettingsFormProps) {
  const [state, action, pending] = useActionState(updateTenant, initialState)

  return (
    <form action={action} className="space-y-4 max-w-sm">
      <input type="hidden" name="tenantId" value={tenantId} />
      <label className="block text-xs font-medium text-gray-500">
        ShopBy Client ID
        <input
          name="clientId"
          required
          defaultValue={clientId}
          className="mt-1 w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none"
        />
      </label>
      <label className="block text-xs font-medium text-gray-500">
        ShopBy API Key
        <input
          name="apiKey"
          required
          type="password"
          defaultValue={apiKey}
          className="mt-1 w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none"
        />
      </label>
      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60"
      >
        {pending ? '저장 중...' : '저장'}
      </button>
    </form>
  )
}
