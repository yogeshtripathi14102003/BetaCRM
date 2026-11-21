import { ENDPOINTS } from '@/config/endpoints';
import { createCrudService } from './createCrudService';

export const teamService = createCrudService(ENDPOINTS.teams);
