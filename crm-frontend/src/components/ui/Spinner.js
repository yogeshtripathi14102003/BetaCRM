import { Loader2 } from 'lucide-react';

export default function Spinner({ label = 'Loading...' }) {
  return (
    <div className="text-muted flex min-h-[50vh] items-center justify-center gap-2" role="status">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
