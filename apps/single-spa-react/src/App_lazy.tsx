import { faro } from '@grafana/faro-react';
import './App.css';
import { Button } from 'antd';

function AppLazy() {
    return (
        <>
            <h1>single-SPA-React-lazy</h1>
            <div className="card">
                <Button
                    onClick={() =>
                        faro.api.pushEvent('lazy-button-click', { name: 'Hello world' }, undefined, {
                            skipDedupe: true,
                            timestampOverwriteMs: 0,
                        })
                    }
                >
                    Hello from remote lazy
                </Button>
            </div>
        </>
    );
}

export default AppLazy;
