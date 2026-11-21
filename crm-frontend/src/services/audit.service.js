import { ENDPOINTS } from '@/config/endpoints';
import { createCrudService } from './createCrudService';

export const auditService = createCrudService(ENDPOINTS.audit);
