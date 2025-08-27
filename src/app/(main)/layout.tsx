
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Sidebar from "@/components/layout/sidebar";
import LogoutButton from "@/components/auth/logout-button";
import { CURRENT_SESSION_KEY } from '@/lib/constants';

function MainLayoutContent({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);
    
    useEffect(() => {
        if (!isClient) return;

        const isLoggedIn = true; // Placeholder, replace with real auth check
        if (!isLoggedIn) {
            router.replace('/login');
            return;
        }

        const sessionId = localStorage.getItem(CURRENT_SESSION_KEY);
        const isAllowedWithoutSession = ['/sessions', '/settings', '/about'].some(p => pathname.startsWith(p));

        if (!sessionId && !isAllowedWithoutSession) {
            router.replace('/sessions');
            return;
        }

        if (sessionId && pathname !== '/sessions') {
            const sessionQueryParam = searchParams.get('session');
            if (!sessionQueryParam || sessionQueryParam !== sessionId) {
                 const newSearchParams = new URLSearchParams(searchParams.toString());
                 newSearchParams.set('session', sessionId);
                 router.replace(`${pathname}?${newSearchParams.toString()}`);
            }
        }
    }, [router, pathname, searchParams, isClient]);
    
    // Only show sidebar if we are not on the sessions page.
    const showSidebar = isClient && pathname !== '/sessions';
    
    return (
        <div className="flex min-h-screen bg-background">
          {showSidebar && <Sidebar />}
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
