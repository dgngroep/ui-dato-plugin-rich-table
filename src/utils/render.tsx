import type React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

export function render(component: React.ReactNode): void {
  const root = document.getElementById('root');
  if (!root) throw new Error('Root element not found');
  createRoot(root).render(<StrictMode>{component}</StrictMode>);
}
