import { http } from '@/lib/http/client';
import { ENDPOINTS } from '@/config/endpoints';
import { createCrudService } from './createCrudService';

export const documentService = {
  ...createCrudService(ENDPOINTS.crm.documents),
  verify: async (id) => (await http.post(`${ENDPOINTS.crm.documents}/${id}/verify`)).data,
  reject: async (id, reason) => (await http.post(`${ENDPOINTS.crm.documents}/${id}/reject`, { reason })).data,
};
