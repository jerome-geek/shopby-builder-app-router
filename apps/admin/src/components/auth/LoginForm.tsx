'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setIsLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold text-gray-900 mb-1">로그인</h1>
      <p className="text-sm text-gray-500 mb-6">계정 정보를 입력해주세요.</p>

      <form onSubmit={handleLogin} className="space-y-4">
        <label className="block text-xs font-medium text-gray-500">
          이메일
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none"
          />
        </label>
        <label className="block text-xs font-medium text-gray-500">
          비밀번호
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none"
          />
        </label>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60"
        >
          {isLoading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        계정이 없으신가요?{' '}
        <Link href="/auth/sign-up" className="text-indigo-600 font-medium hover:underline">
          회원가입
        </Link>
      </p>
    </div>
  )
}
