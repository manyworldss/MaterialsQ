import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../design-system/tokens.css';
import '../design-system/base.css';
import { Popup } from './Popup';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Popup />
  </StrictMode>,
);
