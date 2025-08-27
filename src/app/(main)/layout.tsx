
"use client";

import React, { useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Sidebar from "@/components/layout/sidebar";
import LogoutButton from "@/components/auth/logout-button";
import { CURRENT_SESSION_KEY } from '@/lib/constants';

function MainLayoutContent({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const sessionId = localStorage.getItem(CURRENT_SESSION_KEY);
        const allowedPaths = ['/sessions', '/settings', '/about'];

        // If there's no session ID, force redirect to sessions, unless on an allowed page.
        if (!sessionId && !allowedPaths.some(p => pathname.startsWith(p))) {
            router.replace('/sessions');
            return;
        }

        // If a session IS active, ensure the URL has the correct session query param,
        // unless we are on the session selection page itself.
        if (sessionId && pathname !== '/sessions') {
            const sessionQueryParam = searchParams.get('session');
            if (!sessionQueryParam || sessionQueryParam !== sessionId) {
                 const newSearchParams = new URLSearchParams(searchParams.toString());
                 newSearchParams.set('session', sessionId);
                 router.replace(`${pathname}?${newSearchParams.toString()}`);
            }
        }
    }, [router, pathname, searchParams]);
    
    return (
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <div className="flex flex-1 flex-col">
            <header className="flex h-16 items-center justify-end border-b bg-card px-4 sm:px-6 lg:px-8">
              <LogoutButton />
            </header>
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto animate-fade-in">
              {children}
            </main>
          </div>
        </div>
    );
}


export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
        <MainLayoutContent>{children}</MainLayoutContent>
    </React.Suspense>
  );
}
