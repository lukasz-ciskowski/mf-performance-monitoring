import { create } from 'zustand';
import { type Context, type Span } from '@opentelemetry/api';

interface TracingStore {
    tracingKey: Context | null;
    parentSpan: Span | null;
    setTracingKey: (key: Context) => void;
    setParentSpan: (span: Span) => void;
    clearTracingKey: () => void;
}

export const useTracingStore = create<TracingStore>((set) => ({
    tracingKey: null,
    parentSpan: null,
    setTracingKey: (key) => set({ tracingKey: key }),
    setParentSpan: (span) => set({ parentSpan: span }),
    clearTracingKey: () => set({ tracingKey: null }),
}));
