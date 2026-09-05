import { App } from './App.js';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element was not found.');
ReactDOM.createRoot(root).render(<App />);
