import { createFileRoute, Link } from '@tanstack/react-router';
import { usePageRenderMetrics } from '../hooks/usePageRenderMetrics';

export const Route = createFileRoute('/')({
    component: App,
});

function App() {
    usePageRenderMetrics({ pageName: 'HomePage' });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <header className="min-h-screen flex flex-col items-center justify-center text-white gap-8 px-4">
                <div className="text-center">
                    <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Frontend Monitoring
                    </h1>
                </div>

                <nav className="flex flex-col sm:flex-row gap-4 mt-8">
                    <Link
                        to="/file"
                        preload={false}
                        className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white font-semibold shadow-lg hover:shadow-blue-500/50 transition-all hover:scale-105"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">📄</span>
                            <div className="text-left">
                                <div>File Service</div>
                                <div className="text-xs text-blue-100 font-normal">Read file content</div>
                            </div>
                        </div>
                    </Link>

                    <Link
                        to="/db"
                        preload={false}
                        className="group relative px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white font-semibold shadow-lg hover:shadow-green-500/50 transition-all hover:scale-105"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🗄️</span>
                            <div className="text-left">
                                <div>DB Service</div>
                                <div className="text-xs text-green-100 font-normal">Mongo + Postgres</div>
                            </div>
                        </div>
                    </Link>
                </nav>

                <p className="text-sm text-gray-400 mt-4 max-w-md text-center">
                    Each page calls the BFF service which orchestrates backend microservices. Click to see real-time
                    responses with OpenTelemetry tracing.
                </p>
            </header>
        </div>
    );
}
