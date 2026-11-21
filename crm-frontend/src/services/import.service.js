import { http } from '@/lib/http/client';
import { ENDPOINTS } from '@/config/endpoints';
import { createCrudService } from './createCrudService';

export const importService = {
  ...createCrudService(ENDPOINTS.crm.imports),
  // CSV/Excel upload (multipart). Backend job queue me daalta hai, status polling se dekhte hain.
  upload: async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return (await http.upload(ENDPOINTS.crm.imports, fd)).data;
  },
};
