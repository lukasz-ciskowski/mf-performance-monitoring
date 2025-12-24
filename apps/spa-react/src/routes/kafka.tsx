import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Suspense } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { usePageRenderMetrics } from '../hooks/usePageRenderMetrics';
import { trackedFetch } from '../utils/telemetry/endpoint-metrics';

const BFF = import.meta.env.VITE_BFF_URL || 'http://localhost:8087';

async function fetchKafka() {
    try {
        const res = await trackedFetch(`${BFF}/kafka`);
        const data = await res.json();

        if (!res.ok) throw new Error(`Failed to fetch kafka: ${res.status} ${res.statusText}`);
        return data;
    } catch (error) {
        throw error;
    }
}

export const Route = createFileRoute('/kafka')({
    component: KafkaPage,
});

function KafkaPage() {
    usePageRenderMetrics({ pageName: 'KafkaPage' });

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-100">
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <Link to="/" preload={false} className="text-purple-600 hover:text-purple-800 font-medium">
                        ← Back to Home
                    </Link>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-8">
                <ErrorBoundary>
                    <Suspense
                        fallback={
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                <p className="text-gray-600 mt-2">Sending message to Kafka...</p>
                            </div>
                        }
                    >
                        <KafkaContent />
                    </Suspense>
                </ErrorBoundary>
            </main>
        </div>
    );
}

function KafkaContent() {
    usePageRenderMetrics({ pageName: 'KafkaContent' });

    const { data, refetch, isFetching } = useSuspenseQuery({
        queryKey: ['kafka'],
        queryFn: fetchKafka,
    });

    const handleRefetch = () => {
        refetch();
    };

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Kafka Service (Producer)</h1>
                    <p className="text-purple-100 text-sm">BFF → kafka-service → Kafka broker (2 topics)</p>
                </div>
                <button
                    className="px-4 py-2 bg-white text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    onClick={handleRefetch}
                    disabled={isFetching}
                >
                    {isFetching ? (
                        <>
                            <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></span>
                            Sending...
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

export default KafkaPage;
