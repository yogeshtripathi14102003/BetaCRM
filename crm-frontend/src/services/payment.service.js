import { ENDPOINTS } from '@/config/endpoints';
import { createCrudService } from './createCrudService';

export const paymentService = createCrudService(ENDPOINTS.crm.payments);
