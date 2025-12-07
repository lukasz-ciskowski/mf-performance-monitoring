import Link from 'next/link';
import { DbContent } from './DbContent';

const BFF_URL = process.env.BFF_URL || 'http://localhost:8087';

async function fetchDb() {
    const res = await fetch(`${BFF_URL}/db`, {
        cache: 'no-store',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!res.ok) throw new Error(`Failed to fetch db: ${res.status} ${res.statusText}`);
    return res.json();
}

export default async function DbPage() {
    const initialData = await fetchDb();

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <Link href="/" className="text-green-600 hover:text-green-800 font-medium">
                        ← Back to Home
                    </Link>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-8">
                <DbContent initialData={initialData} />
            </main>
        </div>
    );
}
