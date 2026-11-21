import { AlertCircle } from 'lucide-react';
import { errorMessage } from '@/lib/http/errors';
import Button from '@/components/ui/Button';

export default function ErrorState({ error, onRetry }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-500/30 dark:bg-red-500/10" role="alert">
      <AlertCircle className="mx-auto h-6 w-6 text-red-500" />
      <p className="mt-2 text-sm font-medium text-red-800 dark:text-red-300">Data load nahi ho paya</p>
      <p className="mt-0.5 text-xs text-red-700 dark:text-red-400">{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-3" onClick={() => onRetry()}>
          Dobara try karo
        </Button>
      )}
    </div>
  );
}
