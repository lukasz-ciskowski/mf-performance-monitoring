import { useState } from 'react';
import './App.css';
import { axiosInstance } from './utils/axios';
// import { context, propagation, SpanKind } from '@opentelemetry/api';
// import { FrontendTracerInstance } from './utils/telemetry/FrontendTracer';
// import { useSuspenseQuery } from '@tanstack/react-query';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function App({ traceparent }: { traceparent: string }) {
    const [response, setResponse] = useState<string | null>(null);
    // temporarily disable to simplify the demo

    // const { data: initialResponse } = useSuspenseQuery({
    //     queryKey: ['initial'],
    //     queryFn: async () => {
    //         const ctx = propagation.extract(context.active(), { traceparent });
    //         return context.with(ctx, async () => {
    //             const span = FrontendTracerInstance.startSpan('LazyComponent:retrieve', { kind: SpanKind.SERVER });
    //             const response = await axiosInstance.get('/db-service/db');
    //             const data = response.data;
    //             span.end();

    //             return JSON.stringify(data, null, 2);
    //         });
    //     },
    // });

    const handleClick = async () => {
        setResponse(null);

        const response = await axiosInstance.get('/db-service/db');
        const data = response.data;
        setResponse(JSON.stringify(data, null, 2));
    };
    return (
        <div>
            <button onClick={handleClick}>Call DB multi service request - REMOTE</button>
            {/* {initialResponse && (
                <pre style={{ backgroundColor: 'gray', color: 'white', textAlign: 'left' }}>
                    Initial: {initialResponse}
                </pre>
            )} */}
            {response && <pre style={{ backgroundColor: 'gray', color: 'white', textAlign: 'left' }}>{response}</pre>}
        </div>
    );
}

export default App;
