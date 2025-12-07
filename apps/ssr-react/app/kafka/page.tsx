import Link from 'next/link';
import { KafkaContent } from './KafkaContent';

const BFF_URL = process.env.BFF_URL || 'http://localhost:8087';

async function fetchKafka() {
    const res = await fetch(`${BFF_URL}/kafka`, {
        cache: 'no-store',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!res.ok) throw new Error(`Failed to fetch kafka: ${res.status} ${res.statusText}`);
    return res.json();
}

export default async function KafkaPage() {
    const initialData = await fetchKafka();

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-100">
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <Link href="/" className="text-purple-600 hover:text-purple-800 font-medium">
                        ← Back to Home
                    </Link>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-8">
                <KafkaContent initialData={initialData} />
            </main>
        </div>
    );
}
