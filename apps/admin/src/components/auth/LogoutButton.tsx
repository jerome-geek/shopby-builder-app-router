'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="text-sm font-medium text-gray-500 hover:text-gray-700"
    >
      로그아웃
    </button>
  )
}
