'use client';

import ResourceListPage from '@/features/shared/ResourceListPage';
import { useStudents, studentColumns, studentFilters } from '@/features/students';

export default function Page() {
  return (
    <ResourceListPage
      title="Students"
      description="Converted leads"
      perm="student.read"
      useList={useStudents}
      columns={studentColumns}
      filters={studentFilters}
      searchPlaceholder="Search students..."
    />
  );
}
