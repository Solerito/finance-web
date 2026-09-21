'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PiggyBank,
  Target,
  History,
  BarChart3,
  Menu,
  X,
  Wallet,
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Presupuestos', href: '/budgets', icon: PiggyBank },
  { name: 'Metas', href: '/goals', icon: Target },
  { name: 'Historial', href: '/history', icon: History },
  { name: 'Reportes', href: '/reports', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Mobile top bar ────────────────────────────────────────────── */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#191c24] border-b border-[rgba(240,236,228,0.07)] sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[rgba(155,142,196,0.15)] border border-[rgba(155,142,196,0.3)] flex items-center justify-center">
            <Wallet className="w-4 h-4 text-[#9b8ec4]" />
          </div>
          <span className="font-editorial text-lg text-[#f0ece4] font-medium tracking-tight">
            Finanzas
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-[#9096b0] hover:text-[#f0ece4] rounded-lg hover:bg-[rgba(240,236,228,0.05)] transition-colors"
          aria-label="Abrir menú"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── Mobile backdrop ───────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <aside
        className={[
          'fixed lg:sticky top-0 left-0 z-50 lg:z-30',
          'w-64 h-screen bg-[#191c24] border-r border-[rgba(240,236,228,0.07)]',
          'flex flex-col transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        {/* Brand */}
        <div className="p-5 border-b border-[rgba(240,236,228,0.07)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[rgba(155,142,196,0.15)] border border-[rgba(155,142,196,0.3)] flex items-center justify-center shadow-inner">
              <Wallet className="w-5 h-5 text-[#9b8ec4]" />
            </div>
            <div>
              <p className="text-[#f0ece4] font-semibold font-editorial text-lg leading-tight tracking-tight">
                Finanzas
              </p>
              <p className="text-[11px] text-[#5a5f75] font-medium tracking-wider uppercase">
                Personal App
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <p className="section-label px-2 mb-3">Navegación</p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={[
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium',
                  'transition-all duration-200 group relative border',
                  isActive
                    ? 'bg-[rgba(155,142,196,0.15)] text-[#c4b8e8] border-[rgba(155,142,196,0.3)]'
                    : 'text-[#9096b0] hover:text-[#f0ece4] hover:bg-[rgba(240,236,228,0.04)] border-transparent',
                ].join(' ')}
              >
                <Icon
                  className={[
                    'w-4 h-4 transition-transform duration-200 group-hover:scale-110',
                    isActive ? 'text-[#9b8ec4]' : 'text-[#5a5f75] group-hover:text-[#9096b0]',
                  ].join(' ')}
                />
                <span>{item.name}</span>
                {isActive && (
                  <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-[#9b8ec4] shadow-[0_0_8px_rgba(155,142,196,0.8)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer status */}
        <div className="p-4 border-t border-[rgba(240,236,228,0.07)]">
          <div className="flex items-center gap-2.5 px-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <div>
              <p className="text-xs text-[#f0ece4] font-medium leading-tight">Homelab Active</p>
              <p className="text-[11px] text-[#5a5f75]">SQLite · Local DB</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
