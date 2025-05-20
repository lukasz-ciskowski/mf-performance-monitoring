import { type ComponentType } from 'react';
import * as api from '@opentelemetry/api';
import { SpanKind } from '@opentelemetry/api';
import { useTracingStore } from 'shared';
import React from 'react';
import { FrontendTracerInstance } from './FrontendTracer';
// import { useTracingStore } from 'shared';

export function lazyWithTelemetry(
    importFunc: () => Promise<{ default: ComponentType<unknown> }>,
    name: string,
): React.LazyExoticComponent<ComponentType<unknown>> {
    return React.lazy(async () => {
        const span = FrontendTracerInstance.startSpan(`lazy-load:${name}`, { kind: SpanKind.CLIENT });

        return api.context.with(api.trace.setSpan(api.context.active(), span), async () => {
            useTracingStore.getState().setTracingKey(api.context.active());
            useTracingStore.getState().setParentSpan(span);
            await new Promise<void>((resolve) => {
                setTimeout(() => resolve(), 1000);
            });
            const result = await importFunc();

            span.end();
            return result;
        });
    });
}
