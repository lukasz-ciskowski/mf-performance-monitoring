'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { startRouteSwitch } from '../utils/telemetry/navigation-metrics';

export function NavigationTracker() {
    const pathname = usePathname();

    useEffect(() => {
        startRouteSwitch(pathname);
    }, [pathname]);

    return null;
}
