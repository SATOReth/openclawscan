'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

export function Nav() {
  const path = usePathname();
  const [user, setUser] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const sbRef = useRef<any>(null);

  useEffect(() => {
    import('@supabase/auth-helpers-nextjs').then(({ createClientComponentClient }) => {
      const sb = createClientComponentClient();
      sbRef.current = sb;
      sb.auth.getUser().then(({ data }: any) => setUser(data.user));
      const { data: { subscription } } = sb.auth.onAuthStateChange((_: any, s: any) => setUser(s?.user ?? null));
      return () => subscription.unsubscribe();
    });
  }, []);

  // Close menu on route change
  useEffect(() => { setOpen(false); }, [path]);

  const link = (href: string, label: string) => (
    <Link
      href={href}
      className={`text-[11px] cursor-pointer transition-colors block md:inline ${
        path === href ? 'text-bright' : 'text-dim hover:text-tx'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="px-6 py-3 border-b border-faint sticky top-0 bg-bg/[.93] backdrop-blur-md z-50 max-w-[1100px] mx-auto">
      <div className="flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <span className="text-accent text-[13px]">◈</span>
          <span className="text-[12px] font-bold text-bright">openclawscan</span>
          <span className="text-[9px] text-ghost">v1.0</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex gap-4 items-center">
          {link('/dashboard', 'dashboard')}
          {link('/dashboard/tasks', 'tasks')}
          {link('/dashboard/agents', 'agents')}
          <span className="text-faint">│</span>
          {link('/#pricing', 'pricing')}
          {link('/docs', 'docs')}
          {user ? (
            <button
              onClick={() => sbRef.current?.auth.signOut().then(() => window.location.href = '/')}
              className="text-[11px] text-dim hover:text-c-red transition-colors"
            >
              logout
            </button>
          ) : (
            link('/login', 'login')
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-dim hover:text-tx transition-colors text-[14px] w-8 h-8 flex items-center justify-center"
          aria-label="Menu"
        >
          {open ? '✕' : '≡'}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden pt-3 pb-1 mt-3 border-t border-faint space-y-2.5">
          {link('/dashboard', 'dashboard')}
          {link('/dashboard/tasks', 'tasks')}
          {link('/dashboard/agents', 'agents')}
          <div className="h-px bg-faint" />
          {link('/#pricing', 'pricing')}
          {link('/docs', 'docs')}
          {user ? (
            <button
              onClick={() => sbRef.current?.auth.signOut().then(() => window.location.href = '/')}
              className="text-[11px] text-dim hover:text-c-red transition-colors block"
            >
              logout
            </button>
          ) : (
            link('/login', 'login')
          )}
        </div>
      )}
    </nav>
  );
}
