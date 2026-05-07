'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/dashboard',  label: 'Tableau de bord', icon: '📊' },
  { href: '/candidats',  label: 'Candidats',        icon: '👤' },
  { href: '/formations', label: 'Formations',       icon: '📚' },
  { href: '/qualite',    label: 'Qualité',          icon: '✅' },
  { href: '/veille',     label: 'Veille',           icon: '📰' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 w-60 bg-pink-700 text-white flex flex-col z-50">
        <div className="px-5 py-6 border-b border-pink-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📷</span>
            <div>
              <div className="font-semibold text-sm">Color Aim</div>
              <div className="text-pink-200 text-xs">CRM Qualiopi</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-white/20 text-white'
                    : 'text-pink-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="px-4 py-4 border-t border-pink-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-xs font-semibold">
              MB
            </div>
            <div>
              <div className="text-xs font-medium">Maud Batellier</div>
              <div className="text-pink-200 text-xs">Référente qualité</div>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 ml-60 min-h-screen bg-gray-50">
        {children}
      </main>
    </div>
  )
}