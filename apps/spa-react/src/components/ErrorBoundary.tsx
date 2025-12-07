import { Component, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                this.props.fallback || (
                    <div className="p-8 max-w-2xl mx-auto">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                            <h2 className="text-xl font-bold text-red-800 mb-2">Something went wrong</h2>
                            <p className="text-red-600 mb-4">{this.state.error?.message || 'Unknown error'}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                            >
                                Reload Page
                            </button>
                        </div>
                    </div>
                )
            );
        }

        return this.props.children;
    }
}
