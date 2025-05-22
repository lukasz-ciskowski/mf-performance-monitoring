import { Suspense, useState } from 'react';
import './App.css';
import { axiosInstance } from './utils/axios';
import { lazyWithTelemetry } from './utils/telemetry/lazy';

const Remote = lazyWithTelemetry(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    async () => import('remote/remote-db-app'),
    'remote-db-app',
);

function App() {
    const [response, setResponse] = useState<string | null>(null);

    const handleClick = async () => {
        setResponse(null);
        const response = await axiosInstance.get('/db-service/db');
        const data = response.data;
        setResponse(JSON.stringify(data, null, 2));
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div>
                <button onClick={handleClick}>Call DB multi service request - HOST</button>
                {response && (
                    <pre style={{ backgroundColor: 'gray', color: 'white', textAlign: 'left' }}>{response}</pre>
                )}
            </div>
            <Suspense fallback="loading...">
                <Remote.Component traceparent={Remote.traceparent} />
                {/* <Remote /> */}
            </Suspense>
        </div>
    );
}

export default App;
