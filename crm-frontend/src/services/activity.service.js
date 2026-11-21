import { ENDPOINTS } from '@/config/endpoints';
import { createCrudService } from './createCrudService';

export const activityService = createCrudService(ENDPOINTS.crm.activities);
