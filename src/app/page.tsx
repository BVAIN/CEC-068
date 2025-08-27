
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CURRENT_SESSION_KEY } from '@/lib/constants';

export default function RootRedirectPage() {
    const router = useRouter();
    useEffect(() => {
        // This is a placeholder for a real auth check
        const isLoggedIn = true; 

        if (isLoggedIn) {
             // If logged in, check if a session is active
            const currentSession = localStorage.getItem(CURRENT_SESSION_KEY);
            if (currentSession) {
                router.replace('/home');
            } else {
                router.replace('/sessions');
            }
        } else {
            router.replace('/login');
        }
    }, [router]);

    return null;
}
