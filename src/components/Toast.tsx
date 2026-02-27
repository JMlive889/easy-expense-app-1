import { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  variant: ToastVariant;
  onClose: (id: string) => void;
  duration?: number;
}

export default function Toast({ id, message, variant, onClose, duration = 4000 }: ToastProps) {
  const variantStyles = {
    success: {
      bg: 'bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/90 dark:to-emerald-800/90',
      border: 'border-emerald-300 dark:border-emerald-500/50',
      icon: CheckCircle,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      textColor: 'text-emerald-900 dark:text-white',
    },
    error: {
      bg: 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/90 dark:to-red-800/90',
      border: 'border-red-300 dark:border-red-500/50',
      icon: XCircle,
      iconColor: 'text-red-600 dark:text-red-400',
      textColor: 'text-red-900 dark:text-white',
    },
    info: {
      bg: 'bg-gradient-to-r from-teal-50 to-teal-100 dark:from-teal-900/90 dark:to-teal-800/90',
      border: 'border-teal-300 dark:border-teal-500/50',
      icon: Info,
      iconColor: 'text-teal-600 dark:text-teal-400',
      textColor: 'text-teal-900 dark:text-white',
    },
  };

  const style = variantStyles[variant];
  const Icon = style.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, onClose, duration]);

  return (
    <div
      className={`
        ${style.bg} ${style.border}
        backdrop-blur-md border rounded-2xl shadow-2xl
        px-4 py-3 flex items-center gap-3 min-w-[280px] max-w-[90vw]
        animate-slide-up
      `}
      role="alert"
    >
      <Icon className={`${style.iconColor} flex-shrink-0`} size={20} />
      <p className={`${style.textColor} text-sm flex-1 font-medium`}>{message}</p>
      <button
        onClick={() => onClose(id)}
        className="transition-colors flex-shrink-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
        aria-label="Close notification"
      >
        <X size={18} />
      </button>
    </div>
  );
}
