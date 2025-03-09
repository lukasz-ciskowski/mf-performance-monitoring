// Named imports for increasing bundle size  - for performance profiling
import { Button } from '@mui/material';
import { Home } from '@mui/icons-material';
import './App.css';

function App() {
    return (
        <>
            <h1>single-SPA-React</h1>
            <div className="card">
                <Button variant="contained" startIcon={<Home />}>
                    Hello world
                </Button>
            </div>
        </>
    );
}

export default App;
