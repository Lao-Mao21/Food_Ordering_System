import { Toaster } from 'react-hot-toast';

export const ToastProvider = () => {
  return (
    <Toaster
      position="bottom-right"
      gutter={8}
      toastOptions={{
        duration: 3000, // 3 seconds
        style: {
          background: 'oklch(var(--bg-light))',
          color: 'oklch(var(--text))',
          borderRadius: '12px',
          fontSize: '14px',
        },
        success: {
          style: {
            background: 'oklch(var(--success))',
            color: 'oklch(var(--bg-dark))',
          },
        },
        error: {
          style: {
            background: 'oklch(var(--danger))',
            color: 'oklch(var(--bg-dark))',
          },
        },
      }}
    />
  );
};