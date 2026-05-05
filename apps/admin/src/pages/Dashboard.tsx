import { useEffect, useState } from 'react'
import { Plus, Layout, Globe, Settings, Loader2 } from 'lucide-react'

interface Tenant {
  id: string
  subdomain: string
  _count: {
    pages: number
  }
}

export default function Dashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/tenants')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTenants(data)
        }
      })
      .catch(err => console.error('Failed to load tenants:', err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ShopBy Builder Dashboard (SPA)</h1>
          <p className="text-gray-500">내 쇼핑몰과 페이지를 관리하세요.</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          <Plus size={20} />
          <span>새 쇼핑몰 생성</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tenants.map((tenant) => (
          <div key={tenant.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-indigo-50 p-3 rounded-lg text-indigo-600">
                  <Layout size={24} />
                </div>
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  활성
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{tenant.subdomain}</h3>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
                <Globe size={14} />
                <span>{tenant.subdomain}.shopby.builder</span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-100 pt-4 mt-4">
                <div className="text-gray-500">
                  페이지 <span className="font-semibold text-gray-900">{tenant._count.pages}</span>
                </div>
                <div className="flex gap-4">
                  <button className="text-indigo-600 font-medium hover:underline flex items-center gap-1">
                    편집기
                  </button>
                  <button className="text-gray-500 hover:text-gray-700">
                    <Settings size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {tenants.length === 0 && (
          <div className="col-span-full py-20 text-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
            <Layout className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900">등록된 쇼핑몰이 없습니다.</h3>
            <p className="text-gray-500 mt-1">첫 번째 쇼핑몰을 생성하여 시작해 보세요.</p>
          </div>
        )}
      </div>
    </div>
  )
}
