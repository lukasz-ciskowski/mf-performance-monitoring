import { useState } from 'react';
import { provider } from '@/main';
import { context, trace } from '@opentelemetry/api';

const FileServiceButton = () => {
    const [response, setResponse] = useState<string | null>(null);
    const handleClick = async () => {
        setResponse(null);

        const response = await fetch('/file-service/file');
        const data = await response.json();
        setResponse(JSON.stringify(data, null, 2));

        // const singleSpan = provider.startSpan('file-service-request');
        // context.with(trace.setSpan(context.active(), singleSpan), async () => {
        //     const response = await fetch('http://localhost:8080/file');
        //     const data = await response.json();
        //     setResponse(JSON.stringify(data, null, 2));

        //     trace.getSpan(context.active())?.addEvent('fetching-single-span-completed');
        //     singleSpan.end();
        // });
    };
    return (
        <div>
            <button
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                onClick={handleClick}
            >
                Call single file service request
            </button>
            {response && (
                <pre className="mt-2 bg-gray-800 p-2 rounded text-left max-w-xl mx-auto whitespace-pre-wrap">
                    {response}
                </pre>
            )}
        </div>
    );
};

export default FileServiceButton;
