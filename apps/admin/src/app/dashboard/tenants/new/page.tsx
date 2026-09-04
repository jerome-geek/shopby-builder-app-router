import { CreateTenantForm } from '@/components/dashboard/CreateTenantForm'

export default function NewTenantPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">새 쇼핑몰 생성</h1>
        <p className="text-sm text-gray-500">ShopBy 연동 정보를 입력해주세요.</p>
      </header>
      <CreateTenantForm />
    </div>
  )
}
