export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm text-center">
        <h1 className="text-xl font-bold text-gray-900 mb-2">가입해주셔서 감사합니다!</h1>
        <p className="text-sm text-gray-500">
          이메일로 전송된 확인 링크를 클릭하면 로그인할 수 있습니다.
        </p>
      </div>
    </div>
  )
}
