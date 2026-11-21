import { ENDPOINTS } from '@/config/endpoints';
import { createCrudService } from './createCrudService';

export const roleService = createCrudService(ENDPOINTS.roles);
