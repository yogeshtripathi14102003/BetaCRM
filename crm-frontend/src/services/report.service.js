import { http } from '@/lib/http/client';
import { ENDPOINTS } from '@/config/endpoints';

export const reportService = {
  dashboard: async (params, opts) => (await http.get(ENDPOINTS.crm.reportsDashboard, { params, ...opts })).data,
};
