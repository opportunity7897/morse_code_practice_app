import { App } from './App.js';
const root = document.getElementById('root');
if (!root)
    throw new Error('Root element was not found.');
ReactDOM.createRoot(root).render(React.createElement(App, null));
//# sourceMappingURL=main.js.map