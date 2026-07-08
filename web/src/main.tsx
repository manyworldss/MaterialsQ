import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Import tokens through the bundler so they load in BOTH dev and build.
// (Linking them via a relative <link> in index.html 404s in the dev server.)
import '../../src/design-system/tokens.css';
import '../../src/design-system/base.css';
import './landing.css';
import { Landing } from './Landing';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Landing />
  </StrictMode>,
);
