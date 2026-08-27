import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { ErrorBoundary } from './components/error-boundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
