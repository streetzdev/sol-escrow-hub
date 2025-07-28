import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Buffer } from 'buffer'

// Polyfill Buffer for browser compatibility
window.Buffer = Buffer

createRoot(document.getElementById("root")!).render(<App />);
