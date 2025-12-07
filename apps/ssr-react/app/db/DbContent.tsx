'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { Suspense } from 'react';
import { usePageRenderMetrics } from '../hooks/usePageRenderMetrics';

const BFF_URL = process.env.NEXT_PUBLIC_BFF_URL || 'http://localhost:8087';

async function fetchDb() {
    const res = await fetch(`${BFF_URL}/db`);
    if (!res.ok) throw new Error(`Failed to fetch db: ${res.status} ${res.statusText}`);
    return res.json();
}

export function DbContent({ initialData }: { initialData: any }) {
    return (
        <Suspense
            fallback={
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <p className="text-gray-600 mt-2">Loading database data...</p>
                </div>
            }
        >
            <DbDataDisplay initialData={initialData} />
        </Suspense>
    );
}

function DbDataDisplay({ initialData }: { initialData: any }) {
    usePageRenderMetrics({ pageName: 'DbPage' });

    const { data, refetch, isFetching } = useSuspenseQuery({
        queryKey: ['db'],
        queryFn: fetchDb,
        initialData,
    });

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">DB Service</h1>
                    <p className="text-green-100 text-sm">Aggregating Mongo + Postgres via BFF (SSR)</p>
                </div>
                <button
                    className="px-4 py-2 bg-white text-green-600 rounded-lg font-medium hover:bg-green-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    onClick={() => refetch()}
                    disabled={isFetching}
                >
                    {isFetching ? (
                        <>
                            <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></span>
                            Loading...
                        </>
                    ) : (
                        '🔄 Rerun'
                    )}
                </button>
            </div>
            <div className="p-6">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Response:</h3>
                    <pre className="text-sm text-gray-800 overflow-x-auto whitespace-pre-wrap break-words">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    );
}
