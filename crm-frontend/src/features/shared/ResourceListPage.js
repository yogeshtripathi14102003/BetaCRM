'use client';

import { useCallback, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import RequirePermission from '@/components/common/RequirePermission';
import DataTable from '@/components/data-table/DataTable';
import FilterBar from '@/components/data-table/FilterBar';
import { useListParams } from '@/hooks/useListParams';

// Config se poora list page: title + search/filters + table + pagination, state URL me.
//   useList: React Query hook (createCrudHooks().useList ya custom)
//   filters: [{ key, label, options }]
//   bulkActions: ({ ids, clear }) => node   (selectable=true ho tab selection par bar dikhta hai)
//   toolbar: filter bar ke right side ke extra controls (view toggle etc.)
export default function ResourceListPage({
  title,
  description,
  perm,
  useList,
  columns,
  filters = [],
  searchPlaceholder,
  searchable = true,
  actions,
  toolbar,
  bulkActions,
  defaultSort,
  defaultFilters = {},
  onRowClick,
  emptyTitle,
  extraParams = [],
}) {
  const { params, update, setPage, reset } = useListParams({
    filters: [...filters.map((f) => f.key), ...extraParams],
    defaults: { sort: defaultSort, ...defaultFilters },
  });
  const query = useList(params);
  const selectable = Boolean(bulkActions);

  // Selection: page/filter badalte hi saaf (galat rows par bulk action na chale)
  const [selected, setSelected] = useState(() => new Set());
  const queryKey = JSON.stringify(params);
  const [seenKey, setSeenKey] = useState(queryKey);
  if (seenKey !== queryKey) {
    setSeenKey(queryKey);
    if (selected.size) setSelected(new Set());
  }

  const onSearch = useCallback((v) => update({ search: v }), [update]);
  const toggle = (id) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const toggleAll = (rows) => setSelected((s) => (rows.every((r) => s.has(r.id)) ? new Set() : new Set(rows.map((r) => r.id))));
  const clear = useCallback(() => setSelected(new Set()), []);

  return (
    <RequirePermission perm={perm}>
      <PageHeader title={title} description={description} actions={actions} />
      <FilterBar
        search={params.search}
        onSearch={searchable ? onSearch : undefined}
        searchPlaceholder={searchPlaceholder}
        filters={filters}
        values={params}
        onChange={(key, value) => update({ [key]: value })}
        onReset={reset}
      >
        {toolbar}
      </FilterBar>

      {selectable && selected.size > 0 && (
        <div
          className="border-brand/40 bg-brand-soft mb-3 flex flex-wrap items-center gap-3 rounded-xl border px-4 py-2.5 text-sm"
          role="region"
          aria-label="Bulk actions"
        >
          <span className="font-medium">{selected.size} selected</span>
          {bulkActions({ ids: [...selected], clear })}
          <button type="button" className="text-muted hover:text-fg ml-auto" onClick={clear}>
            Clear
          </button>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={query.data?.items}
        meta={query.data?.meta}
        isLoading={query.isPending}
        isFetching={query.isFetching}
        error={query.error}
        onRetry={query.refetch}
        onPageChange={setPage}
        sort={params.sort}
        onSort={(sort) => update({ sort })}
        onRowClick={onRowClick}
        selectable={selectable}
        selectedIds={selected}
        onToggle={toggle}
        onToggleAll={toggleAll}
        emptyTitle={emptyTitle}
      />
    </RequirePermission>
  );
}
