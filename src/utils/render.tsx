import type React from 'react';
import { StrictMode } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';

// The SDK re-invokes the render hook on every settings change (for a field
// extension that includes formValues), so this runs many times per session.
// Creating a root per call rebuilds the whole subtree and tears the
// contenteditable out from under the cursor, so create it once and re-render.
let root: Root | undefined;

export function render(component: React.ReactNode): void {
  if (!root) {
    const container = document.getElementById('root');
    if (!container) throw new Error('Root element not found');
    root = createRoot(container);
  }
  root.render(<StrictMode>{component}</StrictMode>);
}
