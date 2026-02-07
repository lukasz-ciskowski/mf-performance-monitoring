import { createFileRoute, Link } from '@tanstack/react-router';
import { usePageRenderMetrics } from '../hooks/usePageRenderMetrics';

export const Route = createFileRoute('/')({
    component: App,
});

function App() {
    usePageRenderMetrics({ pageName: 'HomePage' });

    return (
        <div className="min-h-screen bg-slate-800">
            <header className="min-h-screen flex flex-col items-center justify-center text-white gap-8 px-4">
                <div className="text-center">
                    <h1 className="text-5xl font-bold mb-3 text-slate-100">
                        Frontend Monitoring
                    </h1>
                </div>

                <nav className="flex flex-col sm:flex-row gap-4 mt-8">
                    <Link
                        to="/file"
                        preload={false}
                        className="group relative px-8 py-4 bg-slate-600 rounded-xl text-slate-100 font-semibold shadow transition-all hover:bg-slate-500"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">📄</span>
                            <div className="text-left">
                                <div>File Service</div>
                                <div className="text-xs text-slate-300 font-normal">Read file content</div>
                            </div>
                        </div>
                    </Link>

                    <Link
                        to="/db"
                        preload={false}
                        className="group relative px-8 py-4 bg-slate-600 rounded-xl text-slate-100 font-semibold shadow transition-all hover:bg-slate-500"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🗄️</span>
                            <div className="text-left">
                                <div>DB Service</div>
                                <div className="text-xs text-slate-300 font-normal">Mongo + Postgres</div>
                            </div>
                        </div>
                    </Link>
                </nav>

                <p className="text-sm text-slate-400 mt-4 max-w-md text-center">
                    Each page calls the BFF service which orchestrates backend microservices. Click to see real-time
                    responses with OpenTelemetry tracing.
                </p>
            </header>
        </div>
    );
}
