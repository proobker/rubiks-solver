import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { ErrorBoundary } from './components/error-boundary';
import { initErrorReporting } from './lib/error-reporting';
import './index.css';

initErrorReporting();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
