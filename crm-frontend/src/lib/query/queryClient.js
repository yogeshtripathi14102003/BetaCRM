import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { errorMessage, isRetryable } from '@/lib/http/errors';

export function makeQueryClient({ retry = true } = {}) {
  return new QueryClient({
    queryCache: new QueryCache({
      // Pehli load ka error page par dikhta hai. Background refetch fail ho (data already hai) to toast.
      onError: (error, query) => {
        if (query.state.data !== undefined) toast.error(`Update nahi ho paya: ${errorMessage(error)}`);
      },
    }),
    mutationCache: new MutationCache({
      // Har mutation ka error toast yahin se (4th arg = mutation). Silent chahiye to meta: { silent: true }.
      onError: (error, _variables, _onMutateResult, mutation) => {
        if (mutation?.meta?.silent) return;
        toast.error(errorMessage(error));
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000, // 30s tak fresh, bar-bar refetch nahi
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: retry ? (count, error) => isRetryable(error) && count < 2 : false,
      },
      mutations: { retry: false },
    },
  });
}
