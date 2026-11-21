import { ENDPOINTS } from '@/config/endpoints';
import { createCrudService } from './createCrudService';

export const admissionService = createCrudService(ENDPOINTS.crm.admissions);
