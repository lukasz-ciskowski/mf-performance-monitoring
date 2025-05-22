import { create } from 'zustand';

interface TracingStore {
    tracingKey: string | null;
    setTracingKey: (key: string) => void;
    clearTracingKey: () => void;
}

export const useTracingStore = create<TracingStore>((set) => ({
    tracingKey: null,
    parentSpan: null,
    setTracingKey: (key) => set({ tracingKey: key }),
    clearTracingKey: () => set({ tracingKey: null }),
}));
