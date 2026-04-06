'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Car, User, Settings, LogOut, LayoutDashboard, CalendarDays,
  MessageSquare, PlusCircle, Menu, ChevronDown, X,
} from 'lucide-react';
import { clearAuth, getAuth } from '@/lib/auth';
import NotificationBell from '@/components/NotificationBell';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const NAV_LINKS = [
  { href: '/browse', label: 'Browse Cars' },
  { href: '/my-bookings', label: 'My Bookings' },
];

const DROPDOWN_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/my-bookings', icon: CalendarDays, label: 'My Bookings' },
  { href: '/messages', icon: MessageSquare, label: 'Messages' },
];

const DROPDOWN_HOST = [
  { href: '/host/dashboard', icon: PlusCircle, label: 'Host Dashboard' },
  { href: '/host/list', icon: Car, label: 'List My Car' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { userId } = getAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleLogout() {
    clearAuth();
    window.location.href = '/';
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* ─── Navbar ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-14 sm:h-16 items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/browse" className="flex items-center gap-2 font-bold text-lg text-primary shrink-0">
            <Car className="w-5 h-5" /> GarKar
          </Link>

          {/* Center nav — desktop */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right */}
          <div className="flex items-center gap-1">
            <Link
              href="/messages"
              className={`hidden sm:flex p-2 rounded-full transition-colors ${
                pathname.startsWith('/messages') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
            </Link>

            <NotificationBell />

            {/* User dropdown — desktop (custom, no asChild needed) */}
            <div className="relative hidden sm:block" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full hover:bg-muted transition-colors"
              >
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {userId?.slice(-2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-xl shadow-lg py-1 z-50 animate-slide-up">
                  <div className="px-3 py-2.5 border-b border-border mb-1">
                    <p className="text-sm font-semibold text-foreground">My Account</p>
                    <p className="text-xs text-muted-foreground">···{userId?.slice(-6)}</p>
                  </div>
                  {DROPDOWN_ITEMS.map(({ href, icon: Icon, label }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <Icon className="w-4 h-4 text-muted-foreground" /> {label}
                    </Link>
                  ))}
                  <div className="my-1 border-t border-border" />
                  {DROPDOWN_HOST.map(({ href, icon: Icon, label }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <Icon className="w-4 h-4 text-muted-foreground" /> {label}
                    </Link>
                  ))}
                  <div className="my-1 border-t border-border" />
                  <Link
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <Settings className="w-4 h-4 text-muted-foreground" /> Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Log Out
                  </button>
                </div>
              )}
            </div>

            {/* Sheet — mobile */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                className="sm:hidden flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0">
                <div className="flex items-center gap-2 font-bold text-primary px-6 py-5 border-b border-border">
                  <Car className="w-5 h-5" /> GarKar
                </div>
                <nav className="px-3 py-4 space-y-1">
                  {[
                    { href: '/browse', icon: Car, label: 'Browse Cars' },
                    { href: '/my-bookings', icon: CalendarDays, label: 'My Bookings' },
                    { href: '/messages', icon: MessageSquare, label: 'Messages' },
                    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                    { href: '/host/list', icon: PlusCircle, label: 'List My Car' },
                    { href: '/settings', icon: Settings, label: 'Settings' },
                  ].map(({ href, icon: Icon, label }) => {
                    const active = pathname === href || pathname.startsWith(href + '/');
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          active ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                        }`}
                      >
                        <Icon className="w-4 h-4" /> {label}
                      </Link>
                    );
                  })}
                  <Separator className="my-2" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Log Out
                  </button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1 pb-16 sm:pb-0">{children}</main>

      {/* Mobile bottom nav */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40 flex items-center justify-around px-2 py-2">
        {[
          { href: '/browse', icon: Car, label: 'Browse' },
          { href: '/my-bookings', icon: CalendarDays, label: 'Bookings' },
          { href: '/messages', icon: MessageSquare, label: 'Messages' },
          { href: '/dashboard', icon: User, label: 'Profile' },
        ].map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer — desktop */}
      <footer className="hidden sm:block border-t border-border bg-muted/30 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 font-bold text-base text-primary mb-3">
                <Car className="w-4 h-4" /> GarKar
              </div>
              <p className="text-sm text-muted-foreground">Rent cars from your neighbors in the same building.</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Platform</p>
              <div className="space-y-2 text-sm">
                <Link href="/browse" className="block text-muted-foreground hover:text-foreground transition-colors">Browse Cars</Link>
                <Link href="/host/list" className="block text-muted-foreground hover:text-foreground transition-colors">Host a Car</Link>
                <Link href="/how-it-works" className="block text-muted-foreground hover:text-foreground transition-colors">How it Works</Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Support</p>
              <div className="space-y-2 text-sm">
                <Link href="/help" className="block text-muted-foreground hover:text-foreground transition-colors">Help Center</Link>
                <Link href="/contact" className="block text-muted-foreground hover:text-foreground transition-colors">Contact Us</Link>
                <Link href="/terms" className="block text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
                <Link href="/privacy" className="block text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Account</p>
              <div className="space-y-2 text-sm">
                <Link href="/dashboard" className="block text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
                <Link href="/settings" className="block text-muted-foreground hover:text-foreground transition-colors">Settings</Link>
                <button onClick={handleLogout} className="block text-destructive hover:opacity-80 transition-opacity">Log Out</button>
              </div>
            </div>
          </div>
          <Separator />
          <p className="mt-6 text-center text-xs text-muted-foreground">© 2025 GarKar Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
