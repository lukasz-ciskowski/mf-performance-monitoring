import Link from 'next/link';
import { FileContent } from './FileContent';

const BFF_URL = process.env.BFF_URL || 'http://localhost:8087';

async function fetchFile() {
    const res = await fetch(`${BFF_URL}/file`, {
        cache: 'no-store',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!res.ok) throw new Error(`Failed to fetch file: ${res.status} ${res.statusText}`);
    return res.json();
}

export default async function FilePage() {
    const initialData = await fetchFile();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
                        ← Back to Home
                    </Link>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-8">
                <FileContent initialData={initialData} />
            </main>
        </div>
    );
}
