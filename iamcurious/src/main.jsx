import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import CuriousKid from './CuriousKid.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CuriousKid />
  </StrictMode>,
);
