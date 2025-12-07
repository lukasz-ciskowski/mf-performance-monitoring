export default function FileLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-8">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                        <div className="h-8 w-48 bg-blue-400/30 rounded animate-pulse"></div>
                    </div>
                    <div className="p-6">
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
