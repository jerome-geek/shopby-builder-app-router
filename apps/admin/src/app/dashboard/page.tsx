import { prisma } from "@repo/database";
import { Plus, Layout, Globe } from "lucide-react";
import Link from "next/link";
import { requireAdministrator } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const admin = await requireAdministrator();

  // Membership filter baked into the query, not a post-fetch check — an
  // administrator only ever sees tenants they belong to.
  const tenants = await prisma.tenant.findMany({
    where: { memberships: { some: { administratorId: admin.id } }, archivedAt: null },
    include: { _count: { select: { pages: { where: { archivedAt: null } } } } },
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ShopBy Builder Dashboard</h1>
          <p className="text-gray-500">내 쇼핑몰과 페이지를 관리하세요.</p>
        </div>
        <Link
          href="/dashboard/tenants/new"
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} />
          <span>새 쇼핑몰 생성</span>
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tenants.map((tenant) => (
          <Link
            key={tenant.id}
            href={`/dashboard/tenants/${tenant.id}`}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
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
              <div className="text-sm border-t border-gray-100 pt-4 mt-4 text-gray-500">
                페이지 <span className="font-semibold text-gray-900">{tenant._count.pages}</span>
              </div>
            </div>
          </Link>
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
  );
}
