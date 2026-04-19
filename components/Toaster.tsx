'use client';

import { Toaster as SonnerToaster } from 'sonner';

export default function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg',
        },
      }}
    />
  );
}
