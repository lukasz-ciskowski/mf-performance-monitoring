import { Home } from '@mui/icons-material';
import { Button } from '@mui/material';
import './App.css';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Remote from 'remote_app/RemoteApp';
import { Suspense, lazy } from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const RemoteLazy = lazy(() => import('remote_app_lazy/RemoteAppLazy'));

function App() {
    return (
        <>
            <h1>mf-shell-SPA-React</h1>
            <div className="card">
                <Button variant="contained" startIcon={<Home />}>
                    Hello world
                </Button>
            </div>
            <div style={{ border: '1px solid lightgray', marginBottom: '5px' }}>
                <Remote />
            </div>
            <div style={{ border: '1px solid lightgray' }}>
                <Suspense fallback="Loading...">
                    <RemoteLazy />
                </Suspense>
            </div>
        </>
    );
}

export default App;
