import toast from 'react-hot-toast';

export const notify = {

  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  
  info: (message: string) =>
    toast(message, {
      icon: 'ℹ️',
      style: {
        background: 'oklch(var(--info))',
        color: 'oklch(var(--bg-dark))',
    },
  }),  

  warning: (message: string) =>
    toast(message, {
      icon: '⚠️',
      style: {
        background: 'oklch(var(--warning))',
        color: 'oklch(var(--bg-dark))',
    },
  }),

  promise: (promise: Promise<any>, messages: { loading: string; success: string; error: string }) => {
    return toast.promise(promise, messages);
  },
  
};