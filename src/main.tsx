import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/unbounded/500.css';
import '@fontsource/unbounded/600.css';
import './styles.css';
import { App } from './ui/App';

// ?gallery=1 opens the 3D model gallery instead of the planner.
const Gallery3D = lazy(() => import('./ui/Gallery3D'));
const gallery = new URLSearchParams(location.search).has('gallery');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {gallery ? (
      <Suspense fallback={null}>
        <Gallery3D />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);
