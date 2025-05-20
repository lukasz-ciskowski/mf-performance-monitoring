import { useEffect, useState } from 'react';
import './App.css';
import { axiosInstance } from './utils/axios';
import { useTracingStore } from 'shared';
import { context, propagation, SpanKind, trace } from '@opentelemetry/api';
import { FrontendTracerInstance } from './utils/telemetry/FrontendTracer';

function App() {
    const [response, setResponse] = useState<string | null>(null);
    const state = useTracingStore();

    useEffect(() => {
        async function load() {
            const ctx = propagation.extract(context.active(), state.tracingKey);

            context.with(ctx, async () => {
                const span = FrontendTracerInstance.startSpan(
                    'LazyComponent:mount',
                    { kind: SpanKind.SERVER },
                    trace.setSpan(context.active(), state.parentSpan!),
                );

                await new Promise<void>((resolve) => {
                    setTimeout(() => resolve(), 1000);
                });
                span.end();
            });
        }

        load();
    }, []);

    console.log('Tracing state:', state);

    const handleClick = async () => {
        setResponse(null);

        const response = await axiosInstance.get('/db-service/db');
        const data = response.data;
        setResponse(JSON.stringify(data, null, 2));
    };
    return (
        <div>
            <button onClick={handleClick}>Call DB multi service request - REMOTE</button>
            {response && <pre style={{ backgroundColor: 'gray', color: 'white', textAlign: 'left' }}>{response}</pre>}
        </div>
    );
}

export default App;
