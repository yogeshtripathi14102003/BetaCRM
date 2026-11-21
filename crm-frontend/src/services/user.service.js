import { http } from '@/lib/http/client';
import { ENDPOINTS } from '@/config/endpoints';
import { createCrudService } from './createCrudService';

export const userService = {
  ...createCrudService(ENDPOINTS.users),
  setStatus: async (id, status) => (await http.patch(`${ENDPOINTS.users}/${id}`, { status })).data,
};
