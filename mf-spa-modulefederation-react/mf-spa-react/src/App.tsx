import './App.css';
import { Button } from '@mui/material';
import { Wifi } from '@mui/icons-material';

function App() {
    return (
        <>
            <h1>mf-SPA-React</h1>
            <div className="card">
                <Button variant="contained" startIcon={<Wifi />}>
                    Hello from remote
                </Button>
            </div>
        </>
    );
}

export default App;
