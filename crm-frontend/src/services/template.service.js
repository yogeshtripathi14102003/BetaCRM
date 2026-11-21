import { ENDPOINTS } from '@/config/endpoints';
import { createCrudService } from './createCrudService';

export const templateService = createCrudService(ENDPOINTS.crm.templates);
