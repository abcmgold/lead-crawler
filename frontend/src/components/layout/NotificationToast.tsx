import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface NotificationToastProps {
  show: boolean;
  message: string;
  isError: boolean;
}

export default function NotificationToast({ show, message, isError }: NotificationToastProps) {
  if (!show) return null;

  return (
    <div className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-8 sm:bottom-8 sm:max-w-sm border rounded-2xl shadow-2xl p-4 flex items-center gap-3 z-[100] animate-scale-in bg-slate-950/90 backdrop-blur-md ${isError ? 'border-destructive' : 'border-primary'
      }`}>
      {isError ? (
        <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
      ) : (
        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
      )}
      <span className="text-sm font-semibold font-sans text-foreground">{message}</span>
    </div>
  );
}
