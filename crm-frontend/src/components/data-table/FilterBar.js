// 'use client';

// import { useEffect, useRef, useState } from 'react';
// import { Search, X } from 'lucide-react';
// import { useDebounce } from '@/hooks/useDebounce';
// import Select from '@/components/ui/Select';

// // filters: [{ key, label, options: [{ value, label }] }]
// export default function FilterBar({
//   search,
//   onSearch,
//   searchPlaceholder = 'Search...',
//   filters = [],
//   values = {},
//   onChange,
//   onReset,
//   children,
// }) {
//   const [text, setText] = useState(search || '');
//   const debounced = useDebounce(text, 400);
//   const last = useRef(search || '');

//   // URL tabhi update hota hai jab user ne typing roki (400ms)
//   useEffect(() => {
//     if (onSearch && debounced !== last.current) {
//       last.current = debounced;
//       onSearch(debounced);
//     }
//   }, [debounced, onSearch]);

//   const active = Boolean(text) || filters.some((f) => values[f.key]);

//   return (
//     <div className="mb-4 flex flex-wrap items-center gap-2">
//       {onSearch && (
//         <div className="relative w-full sm:w-72">
//           <Search className="text-faint pointer-events-none absolute top-2.5 left-3 h-4 w-4" />
//           <input
//             type="search"
//             value={text}
//             onChange={(e) => setText(e.target.value)}
//             placeholder={searchPlaceholder}
//             aria-label="Search"
//             className="border-line bg-surface text-fg placeholder:text-faint focus:border-brand focus:ring-brand/30 block w-full rounded-lg border py-2 pr-3 pl-9 text-sm shadow-sm outline-none focus:ring-2"
//           />
//         </div>
//       )}
//       {filters.map((f) => (
//         <Select
//           key={f.key}
//           aria-label={f.label}
//           value={values[f.key] || ''}
//           onChange={(e) => onChange(f.key, e.target.value)}
//           placeholder={`All ${f.label.toLowerCase()}`}
//           options={f.options}
//           className="w-40"
//         />
//       ))}
//       {active && (
//         <button
//           type="button"
//           className="text-muted hover:text-fg inline-flex items-center gap-1 text-sm"
//           onClick={() => {
//             setText('');
//             last.current = '';
//             onReset();
//           }}
//         >
//           <X className="h-4 w-4" /> Reset
//         </button>
//       )}
//       {children && <div className="ml-auto flex items-center gap-2">{children}</div>}
//     </div>
//   );
// }



'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import Select from '@/components/ui/Select';

// filters: [{ key, label, options: [{ value, label }] }]
export default function FilterBar({
  search,
  onSearch,
  searchPlaceholder = 'Search...',
  filters = [],
  values = {},
  onChange,
  onReset,
  children,
}) {
  const [text, setText] = useState(search || '');
  const debounced = useDebounce(text, 400);
  const last = useRef(search || '');

  // URL/search state change hone par input sync rakho
  useEffect(() => {
    const currentSearch = search || '';

    setText(currentSearch);
    last.current = currentSearch;
  }, [search]);

  // Search ko debounce karke update karo
  useEffect(() => {
    if (!onSearch || debounced === last.current) return;

    last.current = debounced;
    onSearch(debounced);
  }, [debounced, onSearch]);

  // Select event ya direct value dono handle karo
  const handleFilterChange = (key, valueOrEvent) => {
    const value =
      valueOrEvent?.target
        ? valueOrEvent.target.value
        : valueOrEvent;

    onChange?.(key, value ?? '');
  };

  const active =
    Boolean(text.trim()) ||
    filters.some((filter) => Boolean(values[filter.key]));

  const handleReset = () => {
    setText('');
    last.current = '';
    onReset?.();
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {onSearch && (
        <div className="relative w-full sm:w-72">
          <Search className="text-faint pointer-events-none absolute top-2.5 left-3 h-4 w-4" />

          <input
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Search"
            className="border-line bg-surface text-fg placeholder:text-faint focus:border-brand focus:ring-brand/30 block w-full rounded-lg border py-2 pr-3 pl-9 text-sm shadow-sm outline-none focus:ring-2"
          />
        </div>
      )}

      {filters.map((filter) => (
        <Select
          key={filter.key}
          aria-label={filter.label}
          value={values[filter.key] || ''}
          onChange={(value) =>
            handleFilterChange(filter.key, value)
          }
          placeholder={`All ${filter.label.toLowerCase()}`}
          options={filter.options}
          className="w-40"
        />
      ))}

      {active && (
        <button
          type="button"
          className="text-muted hover:text-fg inline-flex items-center gap-1 text-sm"
          onClick={handleReset}
        >
          <X className="h-4 w-4" />
          Reset
        </button>
      )}

      {children && (
        <div className="ml-auto flex items-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}

