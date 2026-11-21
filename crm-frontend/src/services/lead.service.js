// import { http } from '@/lib/http/client';
// import { ENDPOINTS } from '@/config/endpoints';
// import { createCrudService } from './createCrudService';

// export const leadService = {
//   ...createCrudService(ENDPOINTS.crm.leads),
//   setStatus: async (id, status) => (await http.patch(`${ENDPOINTS.crm.leads}/${id}`, { status })).data,
//   // bulk: action = 'assign' ({ userId }) | 'status' ({ status }) | 'delete'  -> { affected }
//   bulk: async (action, ids, extra = {}) => (await http.post(`${ENDPOINTS.crm.leads}/bulk`, { action, ids, ...extra })).data,
//   // filtered list ko CSV file me ({ blob, filename })
//   exportCsv: (params) => http.download(`${ENDPOINTS.crm.leads}/export`, { params }),
//   assign: async (id, userId) => (await http.post(`${ENDPOINTS.crm.leads}/${id}/assign`, { userId })).data,
// };


import { http } from '@/lib/http/client';
import { ENDPOINTS } from '@/config/endpoints';
import { createCrudService } from './createCrudService';
4
export const leadService = {
  ...createCrudService(ENDPOINTS.crm.leads),

  // Update lead status
  setStatus: async (id, status) =>
    (
      await http.patch(
        `${ENDPOINTS.crm.leads}/${id}`,
        { status }
      )
    ).data,

  // Bulk actions (status, delete, etc.)
  // Backend /leads/bulk route must be implemented for these actions.
  bulk: async (action, ids, extra = {}) =>
    (
      await http.post(
        ENDPOINTS.crm.leadsBulk,
        { action, ids, ...extra }
      )
    ).data,

  // Bulk lead assignment
  bulkAssign: async (leadIds, userId, note) =>
    (
      await http.post(
        ENDPOINTS.crm.assignments,
        {
          leadIds,
          userId,
          ...(note ? { note } : {}),
        }
      )
    ).data,

  // Single lead assignment
  assign: async (id, userId, note) =>
    (
      await http.post(
        ENDPOINTS.crm.assignments,
        {
          leadIds: [id],
          userId,
          ...(note ? { note } : {}),
        }
      )
    ).data,

  // Export leads
  exportCsv: (params) =>
    http.download(
      `${ENDPOINTS.crm.leads}/export`,
      { params }
    ),
};
