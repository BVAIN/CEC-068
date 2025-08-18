
"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function TrashRedirectPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/trash/issues');
    }, [router]);

    return null;
}
