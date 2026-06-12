'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FaMap,
  FaTachometerAlt,
  FaGamepad,
  FaTags,
  FaMapMarkerAlt,
  FaRoute,
  FaTable,
  FaRobot,
  FaBars,
  FaTimes,
  FaArrowLeft,
} from 'react-icons/fa';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: FaTachometerAlt, exact: true },
  { href: '/admin/games', label: 'Games', icon: FaGamepad },
  { href: '/admin/import', label: 'AI Import', icon: FaRobot },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-60' : 'w-0'
        } flex-shrink-0 transition-all duration-300 overflow-hidden`}
      >
        <div className="w-60 h-full flex flex-col bg-sidebar-bg border-r border-border">
          {/* Logo */}
          <div className="px-4 py-5 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <FaMap className="text-white text-sm" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-foreground">MapMe</h1>
                <p className="text-[10px] text-muted uppercase tracking-wider">
                  Admin Panel
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div className="space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-primary/10 text-primary border-l-2 border-primary'
                        : 'text-muted hover:text-foreground hover:bg-card'
                    }`}
                  >
                    <item.icon className={`text-sm ${active ? 'text-primary' : ''}`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Sub-sections info */}
            <div className="mt-6 pt-4 border-t border-border">
              <p className="px-3 text-[10px] uppercase tracking-wider text-muted mb-2">
                Manage within Games
              </p>
              <div className="space-y-0.5">
                {[
                  { icon: FaMap, label: 'Maps' },
                  { icon: FaTags, label: 'Categories' },
                  { icon: FaMapMarkerAlt, label: 'POIs' },
                  { icon: FaRoute, label: 'Routes' },
                  { icon: FaTable, label: 'Data Tables' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-muted/60"
                  >
                    <item.icon className="text-xs" />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </nav>

          {/* Back to site */}
          <div className="px-3 py-4 border-t border-border">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-card rounded-lg transition-colors"
            >
              <FaArrowLeft className="text-xs" />
              Back to Site
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/30 backdrop-blur-sm shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-muted hover:text-foreground transition-colors p-1"
          >
            {sidebarOpen ? <FaTimes className="text-sm" /> : <FaBars className="text-sm" />}
          </button>
          <div className="text-xs text-muted">
            MapMe Admin
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
