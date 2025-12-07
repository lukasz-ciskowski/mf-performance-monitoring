import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Suspense } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';

const BFF = import.meta.env.VITE_BFF_URL || 'http://localhost:8087';

async function fetchFile() {
    const res = await fetch(`${BFF}/file`);
    if (!res.ok) throw new Error(`Failed to fetch file: ${res.status} ${res.statusText}`);
    return res.json();
}

export const Route = createFileRoute('/file')({
    component: FilePage,
});

function FilePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <Link to="/" className="text-blue-600 hover:text-blue-800 font-medium">
                        ← Back to Home
                    </Link>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-8">
                <ErrorBoundary>
                    <Suspense
                        fallback={
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <p className="text-gray-600 mt-2">Loading file data...</p>
                            </div>
                        }
                    >
                        <FileContent />
                    </Suspense>
                </ErrorBoundary>
            </main>
        </div>
    );
}

function FileContent() {
    const { data, refetch, isFetching } = useSuspenseQuery({
        queryKey: ['file'],
        queryFn: fetchFile,
    });

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">File Service</h1>
                    <p className="text-blue-100 text-sm">Reading file via BFF → file-service</p>
                </div>
                <button
                    className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    onClick={() => refetch()}
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
    );
}

export default FilePage;
