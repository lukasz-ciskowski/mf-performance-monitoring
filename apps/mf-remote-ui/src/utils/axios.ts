import axios from 'axios';
import { SpanKind } from '@opentelemetry/api';
import * as api from '@opentelemetry/api';
import { FrontendTracerInstance } from './telemetry/FrontendTracer';

export const axiosInstance = axios.create({});

axiosInstance.interceptors.request.use((config) => {
    const service = config.url?.split('/')[1];

    const span = FrontendTracerInstance.startSpan(`axios:${config.method?.toUpperCase() || 'GET'}`, {
        attributes: {
            'http.url': config.url,
            'http.method': config.method || 'GET',
            'peer.service': service,
        },
        kind: SpanKind.CLIENT,
    });

    return api.context.with(api.trace.setSpan(api.context.active(), span), async () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        config.span = span;
        config.headers = config.headers || {};
        api.propagation.inject(api.context.active(), config.headers);
        return config;
    });
});

axiosInstance.interceptors.response.use(
    (response) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const span = response.config.span;
        if (span) {
            span.setAttribute('http.status_code', response.status);
            span.end();
        }
        return response;
    },
    (error) => {
        const span = error.config?.span;
        if (span) {
            span.setAttribute('http.status_code', error.response?.status || 500);
            span.recordException(error);
            span.end();
        }
        return Promise.reject(error);
    },
);
