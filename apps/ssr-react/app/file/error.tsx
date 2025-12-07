'use client';

import Link from 'next/link';

export default function FileError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
                        ← Back to Home
                    </Link>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-8">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-4">
                        <h1 className="text-2xl font-bold text-white">Error Loading File Service</h1>
                    </div>
                    <div className="p-6">
                        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                            <p className="text-red-800 font-medium">{error.message}</p>
                            {error.digest && <p className="text-red-600 text-sm mt-2">Error ID: {error.digest}</p>}
                        </div>
                        <button
                            onClick={reset}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
