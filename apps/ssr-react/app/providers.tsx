'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { TelemetryInitializer } from './components/TelemetryInitializer';
import { NavigationTracker } from './components/NavigationTracker';

export function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // 1 minute
                        refetchOnWindowFocus: false,
                    },
                },
            }),
    );

    return (
        <QueryClientProvider client={queryClient}>
            <TelemetryInitializer />
            <NavigationTracker />
            {children}
        </QueryClientProvider>
    );
}
