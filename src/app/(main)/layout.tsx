
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
        // If there's no session ID and we are not already on the sessions page, redirect there.
        if (!sessionId && pathname !== '/sessions') {
            router.replace('/sessions');
            return; // Stop further execution in this render
        }

        if (sessionId) {
            const sessionQueryParam = searchParams.get('session');
            if (!sessionQueryParam || sessionQueryParam !== sessionId) {
                // This preserves the current path but adds the correct session ID
                const currentPath = window.location.pathname;
                router.replace(`${currentPath}?session=${sessionId}`);
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
