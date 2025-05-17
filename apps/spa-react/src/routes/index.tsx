import { createFileRoute } from '@tanstack/react-router';
import FileServiceButton from '../components/FileServiceButton';
import DbServiceButton from '../components/DbServiceButton';

export const Route = createFileRoute('/')({
    component: App,
});

function App() {
    return (
        <div className="text-center">
            <header className="min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white gap-4 ">
                <FileServiceButton />
                <DbServiceButton />
            </header>
        </div>
    );
}
