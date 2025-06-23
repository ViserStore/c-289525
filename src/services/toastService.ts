
import toast from 'react-hot-toast';

export type ToastType = 'success' | 'error' | 'loading' | 'info';

interface ToastOptions {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  icon?: string;
}

class ToastService {
  // Success toast
  success(message: string, options?: ToastOptions) {
    return toast.success(message, {
      duration: options?.duration || 4000,
      position: options?.position || 'top-center',
      icon: options?.icon || '✅',
      style: {
        background: '#10B981',
        color: '#fff',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
      },
    });
  }

  // Error toast
  error(message: string, options?: ToastOptions) {
    return toast.error(message, {
      duration: options?.duration || 5000,
      position: options?.position || 'top-center',
      icon: options?.icon || '❌',
      style: {
        background: '#EF4444',
        color: '#fff',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
      },
    });
  }

  // Info toast
  info(message: string, options?: ToastOptions) {
    return toast(message, {
      duration: options?.duration || 4000,
      position: options?.position || 'top-center',
      icon: options?.icon || 'ℹ️',
      style: {
        background: '#3B82F6',
        color: '#fff',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
      },
    });
  }

  // Loading toast
  loading(message: string, options?: ToastOptions) {
    return toast.loading(message, {
      position: options?.position || 'top-center',
      style: {
        background: '#6B7280',
        color: '#fff',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
      },
    });
  }

  // Promise toast for async operations
  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    },
    options?: ToastOptions
  ) {
    return toast.promise(promise, messages, {
      position: options?.position || 'top-center',
      style: {
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
      },
      success: {
        style: {
          background: '#10B981',
          color: '#fff',
        },
        icon: '✅',
      },
      error: {
        style: {
          background: '#EF4444',
          color: '#fff',
        },
        icon: '❌',
      },
      loading: {
        style: {
          background: '#6B7280',
          color: '#fff',
        },
      },
    });
  }

  // Dismiss all toasts
  dismissAll() {
    toast.dismiss();
  }

  // Dismiss specific toast
  dismiss(toastId: string) {
    toast.dismiss(toastId);
  }
}

export const toastService = new ToastService();
export default toastService;
