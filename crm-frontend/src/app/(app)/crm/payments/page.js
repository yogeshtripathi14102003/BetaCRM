'use client';

import ResourceListPage from '@/features/shared/ResourceListPage';
import { usePayments, paymentColumns, paymentFilters } from '@/features/payments';

export default function Page() {
  return (
    <ResourceListPage
      title="Payments"
      description="Fees aur receipts"
      perm="payment.read"
      useList={usePayments}
      columns={paymentColumns}
      filters={paymentFilters}
      searchPlaceholder="Search by student..."
    />
  );
}
