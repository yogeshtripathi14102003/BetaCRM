import { ENDPOINTS } from '@/config/endpoints';
import { createCrudService } from './createCrudService';

export const studentService = createCrudService(ENDPOINTS.crm.students);
