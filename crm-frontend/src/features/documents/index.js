import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/common/StatusBadge';
import { useCan } from '@/hooks/useCan';
import { createCrudHooks } from '@/lib/query/createCrudHooks';
import { queryKeys } from '@/lib/query/keys';
import { formatDate } from '@/lib/format';
import { documentService } from '@/services';

const keys = queryKeys.documents;
export const { useList: useDocuments } = createCrudHooks({ service: documentService, keys, entity: 'Document' });

function useDocumentAction(fn, message) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.lists() });
      toast.success(message);
    },
  });
}
export const useVerifyDocument = () => useDocumentAction((id) => documentService.verify(id), 'Document verify ho gaya');
export const useRejectDocument = () => useDocumentAction((id) => documentService.reject(id), 'Document reject ho gaya');

export const documentFilters = [
  { key: 'status', label: 'Status', options: ['pending', 'verified', 'rejected'].map((v) => ({ value: v, label: v })) },
];

// Columns me actions hain (mutation + permission), isliye ye hook hai
export function useDocumentColumns() {
  const can = useCan();
  const verify = useVerifyDocument();
  const reject = useRejectDocument();
  const busy = (id) => (verify.isPending && verify.variables === id) || (reject.isPending && reject.variables === id);

  return [
    { key: 'student', header: 'Student', cell: (d) => <span className="font-medium">{d.student?.name}</span> },
    { key: 'type', header: 'Document' },
    { key: 'status', header: 'Status', cell: (d) => <StatusBadge value={d.status} /> },
    { key: 'createdAt', header: 'Uploaded', sortable: true, cell: (d) => formatDate(d.createdAt) },
    {
      key: 'actions',
      header: '',
      cell: (d) =>
        d.status === 'pending' && can('document.verify') ? (
          <div className="flex gap-2">
            <Button className="px-2.5 py-1" loading={busy(d.id)} onClick={() => verify.mutate(d.id)}>
              Verify
            </Button>
            <Button variant="secondary" className="px-2.5 py-1" disabled={busy(d.id)} onClick={() => reject.mutate(d.id)}>
              Reject
            </Button>
          </div>
        ) : null,
    },
  ];
}
