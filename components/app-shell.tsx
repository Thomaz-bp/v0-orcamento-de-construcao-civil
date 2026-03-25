'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FolderKanban,
  Package,
  Truck,
  FileText,
  Send,
  Calculator,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Projetos', href: '/projetos', icon: FolderKanban },
  { name: 'Materiais', href: '/materiais', icon: Package },
  { name: 'Fornecedores', href: '/fornecedores', icon: Truck },
  { name: 'Memoriais', href: '/memoriais', icon: FileText },
  { name: 'Cotações', href: '/cotacoes', icon: Send },
  { name: 'Orçamentos', href: '/orcamentos', icon: Calculator },
]

const secondaryNavigation = [
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
]

function SidebarContent({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <>
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="flex flex-col gap-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="my-4 border-t border-sidebar-border" />

        <ul className="flex flex-col gap-1">
          {secondaryNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile Header */}
      <div className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center border-b border-sidebar-border bg-sidebar px-4 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-sidebar p-0">
            <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
            <div className="flex h-14 items-center border-b border-sidebar-border px-4">
              <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Calculator className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-semibold text-sidebar-foreground">ObraSync</span>
              </Link>
            </div>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Calculator className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sidebar-foreground">ObraSync</span>
        </Link>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Calculator className="h-4 w-4 text-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="font-semibold text-sidebar-foreground">
                ObraSync
              </span>
            )}
          </Link>
        </div>

        <SidebarContent collapsed={collapsed} />

        {/* Collapse Button */}
        <div className="border-t border-sidebar-border p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  )
}
