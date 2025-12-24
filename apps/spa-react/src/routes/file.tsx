import { createFileRoute, Link } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { queryClient } from '@/main';
import { usePageRenderMetrics } from '../hooks/usePageRenderMetrics';
import { trackedFetch } from '@/utils/telemetry/endpoint-metrics';

const BFF = import.meta.env.VITE_BFF_URL || 'http://localhost:8087';

async function fetchFile() {
    try {
        const res = await trackedFetch(`${BFF}/file`);
        const data = await res.json();
        if (!res.ok) throw new Error(`Failed to fetch file: ${res.status} ${res.statusText}`);
        return data;
    } catch (error) {
        throw error;
    }
}

const fetchFileQuery = queryOptions({
    queryKey: ['file'],
    queryFn: fetchFile,
    staleTime: 0,
    // staleTime: 1000 * 60 * 5, // 5 minutes
});

export const Route = createFileRoute('/file')({
    component: FilePage,
    loader: async () => {
        await queryClient.ensureQueryData(fetchFileQuery);
    },
});

function FilePage() {
    usePageRenderMetrics({ pageName: 'FilePage' });

    const { data, refetch, isFetching } = useSuspenseQuery(fetchFileQuery);

    const handleRefetch = () => {
        refetch();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <Link to="/" preload={false} className="text-blue-600 hover:text-blue-800 font-medium">
                        ← Back to Home
                    </Link>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-8">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white">File Service</h1>
                            <p className="text-blue-100 text-sm">Reading file via BFF → file-service</p>
                        </div>
                        <button
                            id="rerun-button"
                            className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            onClick={handleRefetch}
                            disabled={isFetching}
                        >
                            {isFetching ? (
                                <>
                                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></span>
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
            </main>
        </div>
    );
}

export default FilePage;
