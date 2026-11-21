import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { reportService } from '@/services';

export const useDashboardReport = (params, options) =>
  useQuery({
    queryKey: queryKeys.reports.dashboard(params),
    queryFn: ({ signal }) => reportService.dashboard(params, { signal }),
    staleTime: 60_000,
    ...options,
  });
