'use client';

// createCrudService ka contract:
//   list   -> { items, meta }      get -> record (seedha)
//   create -> record               update -> record (PATCH)      remove -> id
// ASSUMPTION: React Query v5. SWR ho to sirf body badalni hai, hook ke naam wahi rakhna.
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { admissionService } from '@/services';

const KEY = 'admissions';

export const useAdmissions = (params) =>
  useQuery({
    queryKey: [KEY, 'list', params],
    queryFn: () => admissionService.list(params),
    placeholderData: keepPreviousData,
  });

export const useAdmission = (id) =>
  useQuery({
    queryKey: [KEY, 'detail', id],
    queryFn: () => admissionService.get(id),
    enabled: Boolean(id),
  });

const useInvalidate = () => {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: [KEY] });
};

export const useCreateAdmission = () => {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (data) => admissionService.create(data), onSuccess: invalidate });
};

export const useUpdateAdmission = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }) => admissionService.update(id, data),
    onSuccess: invalidate,
  });
};

export const useDeleteAdmission = () => {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (id) => admissionService.remove(id), onSuccess: invalidate });
};

// Current filters ke hisaab se CSV download (backend ki max limit 100 rows)
export const useExportAdmissions = () =>
  useMutation({
    mutationFn: async (params) => {
      const res = await admissionService.list({ ...params, page: 1, limit: 100 });
      const rows = res.items;
      const headers = [
        'studentName', 'phone', 'email', 'universityName', 'course', 'branch',
        'admissionDate', 'totalFees', 'leadSource', 'referralName', 'referralNumber',
        'counselorName', 'admissionStatus',
      ];
      const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n');

      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      const a = Object.assign(document.createElement('a'), { href: url, download: 'admissions.csv' });
      a.click();
      URL.revokeObjectURL(url);
    },
  });
