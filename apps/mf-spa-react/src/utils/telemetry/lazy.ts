import { type ComponentType } from 'react';
import * as api from '@opentelemetry/api';
import { SpanKind } from '@opentelemetry/api';
import React from 'react';
import { FrontendTracerInstance } from './FrontendTracer';

export function lazyWithTelemetry(
    importFunc: () => Promise<{ default: ComponentType<unknown> }>,
    name: string,
): { Component: React.LazyExoticComponent<ComponentType<{ traceparent: string }>>; traceparent: string } {
    const span = FrontendTracerInstance.startSpan(`lazy-load:${name}`, { kind: SpanKind.CLIENT });
    const contextSpan = api.trace.setSpan(api.context.active(), span);

    return api.context.with(contextSpan, () => {
        const headers: { traceparent: string } = { traceparent: '' };
        api.propagation.inject(api.context.active(), headers);
        return {
            Component: React.lazy(async () => {
                const result = await importFunc();
                span.end();
                return result;
            }) as React.LazyExoticComponent<ComponentType<{ traceparent: string }>>,
            traceparent: headers['traceparent'],
        };
    });
}
