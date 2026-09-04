interface AuthErrorPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const { error } = await searchParams

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm text-center">
        <h1 className="text-xl font-bold text-gray-900 mb-2">문제가 발생했습니다.</h1>
        <p className="text-sm text-gray-500">
          {error ?? '알 수 없는 오류가 발생했습니다.'}
        </p>
      </div>
    </div>
  )
}
