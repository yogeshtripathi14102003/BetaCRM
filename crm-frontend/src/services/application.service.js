import { ENDPOINTS } from '@/config/endpoints';
import { createCrudService } from './createCrudService';

export const applicationService = createCrudService(ENDPOINTS.crm.applications);
