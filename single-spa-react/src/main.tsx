import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import App from './App.tsx';

import { getWebInstrumentations, initializeFaro } from '@grafana/faro-react';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';

initializeFaro({
    // required: the URL of the Grafana collector
    url: 'http://localhost:8027/collect',

    // required: the identification label of your application
    app: {
        name: 'single_spa_react_2',
        version: '1.0.0',
        environment: 'production',
    },
    instrumentations: [...getWebInstrumentations(), new TracingInstrumentation()],
});

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
