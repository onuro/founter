'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { LogOut, Settings, Image, Globe, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Generator', href: '/generator', icon: <Image className="w-4 h-4" /> },
  { label: 'Fetcher', href: '/fetcher', icon: <Globe className="w-4 h-4" /> },
  { label: 'Settings', href: '/settings', icon: <Settings className="w-4 h-4" /> },
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  // Determine current page label
  const currentPage = navItems.find(item => pathname.startsWith(item.href))?.label || '';

  return (
    <div className="pt-5 px-3 max-w-[1750px] mx-auto">
      <header className="w-full bg-card backdrop-blur-sm sticky top-0 z-50 px-6 h-16 flex items-center justify-between rounded-md">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold tracking-tight">FOUNTER</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm text-muted-foreground uppercase tracking-wider">
            {currentPage}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Desktop Navigation */}
          <nav className="hidden sm:flex items-center gap-1 mr-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'cursor-pointer',
                    pathname.startsWith(item.href) && 'bg-accent text-foreground'
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Button>
              </Link>
            ))}
          </nav>

          {/* Desktop Logout */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="hidden sm:flex cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{isLoggingOut ? 'Signing out...' : 'Sign out'}</span>
          </Button>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
            className="sm:hidden cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Mobile Menu Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="w-64">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-2 mt-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start cursor-pointer',
                    pathname.startsWith(item.href) && 'bg-accent text-foreground'
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Button>
              </Link>
            ))}
            <Button
              variant="ghost"
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              disabled={isLoggingOut}
              className="w-full justify-start cursor-pointer mt-4"
            >
              <LogOut className="w-4 h-4" />
              <span>{isLoggingOut ? 'Signing out...' : 'Sign out'}</span>
            </Button>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
