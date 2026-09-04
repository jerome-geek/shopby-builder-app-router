import { LogoutButton } from '@/components/auth/LogoutButton'
import { requireAdministrator } from '@/lib/auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // proxy.ts already redirects unauthenticated requests; this is the
  // page-level check Next.js recommends as a second line of defense. It
  // also provisions the Administrator row (no signup webhook exists yet)
  // before any page below tries to check tenant membership.
  const admin = await requireAdministrator()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-3">
        <span className="text-sm font-semibold text-gray-800">ShopBy Builder Admin</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{admin.email}</span>
          <LogoutButton />
        </div>
      </header>
      {children}
    </div>
  )
}
