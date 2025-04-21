import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import './App.css';
import { Button } from '@mui/material';
import { Wifi } from '@mui/icons-material';
function App() {
    return (_jsxs(_Fragment, { children: [_jsx("h1", { children: "mf-SPA-React" }), _jsx("div", { className: "card", children: _jsx(Button, { variant: "contained", startIcon: _jsx(Wifi, {}), children: "Hello from remote" }) })] }));
}
export default App;
