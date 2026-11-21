import { http } from '@/lib/http/client';

// Standard REST resource ke liye service banata hai:
//   GET /x?page=&limit=&search=...  -> { items, meta }
//   GET /x/:id | POST /x | PATCH /x/:id | DELETE /x/:id
// Backend ka response contract: { success, message, data, meta }  (docs/API_CONTRACT.md)
export function createCrudService(basePath) {
  return {
    basePath,
    list: async (params, opts) => {
      const res = await http.get(basePath, { params, ...opts });
      return { items: res.data, meta: res.meta };
    },
    get: async (id, opts) => (await http.get(`${basePath}/${id}`, opts)).data,
    create: async (body) => (await http.post(basePath, body)).data,
    update: async (id, body) => (await http.patch(`${basePath}/${id}`, body)).data,
    remove: async (id) => {
      await http.delete(`${basePath}/${id}`);
      return id;
    },
  };
}
