import { http } from '@/lib/http/client';
import { ENDPOINTS } from '@/config/endpoints';
import { createCrudService } from './createCrudService';

export const followupService = {
  ...createCrudService(ENDPOINTS.crm.followups),
  complete: async (id) => (await http.post(`${ENDPOINTS.crm.followups}/${id}/complete`)).data,
};
