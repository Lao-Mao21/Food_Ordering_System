import toast, { type ToastOptions } from 'react-hot-toast';

export const notify = {
  success: (message: string, options?: ToastOptions) => toast.success(message, options),
  error: (message: string, options?: ToastOptions) => toast.error(message, options),

  info: (message: string, options?: ToastOptions) =>
    toast(message, {
      icon: 'i',
      ...options,
      style: {
        background: 'oklch(var(--info))',
        color: 'oklch(var(--bg-dark))',
        ...options?.style,
      },
    }),

  warning: (message: string, options?: ToastOptions) =>
    toast(message, {
      icon: '!',
      ...options,
      style: {
        background: 'oklch(var(--warning))',
        color: 'oklch(var(--bg-dark))',
        ...options?.style,
      },
    }),

  promise: <T>(promise: Promise<T>, messages: { loading: string; success: string; error: string }) => {
    return toast.promise(promise, messages);
  },
};