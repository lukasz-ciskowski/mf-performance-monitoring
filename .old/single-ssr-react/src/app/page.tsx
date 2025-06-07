import { trace } from '@opentelemetry/api';

export default async function Home() {
    const data = await trace.getTracer('nextjs-example').startActiveSpan('fetchGithubStars', async (span) => {
        try {
            const serverResponse = await fetch('http://localhost:8080');
            const data = await serverResponse.json();
            return data;
        } finally {
            span.end();
        }
    });

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-24">
            <h1 className="text-2xl">{data.message}</h1>
        </div>
    );
}
