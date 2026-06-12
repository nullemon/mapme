'use client';

import { useState, useMemo } from 'react';
import {
  FaSearch,
  FaSortUp,
  FaSortDown,
  FaSort,
  FaChevronLeft,
  FaChevronRight,
} from 'react-icons/fa';

/* ---------- props ---------- */

export interface DataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
}

export interface DataTableProps {
  columns: DataTableColumn[];
  data: Record<string, unknown>[];
  searchable?: boolean;
  title?: string;
  pageSize?: number;
}

/* ---------- component ---------- */

export default function DataTable({
  columns,
  data,
  searchable = true,
  title,
  pageSize = 15,
}: DataTableProps) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);

  // Filter
  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = row[col.key];
        return val != null && String(val).toLowerCase().includes(q);
      }),
    );
  }, [data, search, columns]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let cmp: number;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal).localeCompare(String(bVal), undefined, {
          numeric: true,
        });
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paged = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  };

  const SortIcon = ({ col }: { col: DataTableColumn }) => {
    if (!col.sortable) return null;
    if (sortKey !== col.key)
      return <FaSort className="ml-1 inline text-[10px] text-gray-600" />;
    return sortDir === 'asc' ? (
      <FaSortUp className="ml-1 inline text-[10px] text-indigo-400" />
    ) : (
      <FaSortDown className="ml-1 inline text-[10px] text-indigo-400" />
    );
  };

  return (
    <div className="w-full rounded-lg border border-gray-700 bg-gray-900 shadow">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-gray-700 px-4 py-3">
        {title && (
          <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
        )}
        {!title && <span />}

        {searchable && (
          <div className="relative w-56">
            <FaSearch className="absolute left-2.5 top-2.5 text-xs text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Filter..."
              className="w-full rounded bg-gray-800 py-2 pl-7 pr-3 text-xs text-gray-200 placeholder-gray-500 outline-none ring-1 ring-gray-700 focus:ring-indigo-500 transition-colors"
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-700 bg-gray-800/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`px-4 py-2 text-xs font-medium uppercase tracking-wider text-gray-400 ${
                    col.sortable
                      ? 'cursor-pointer select-none hover:text-gray-200'
                      : ''
                  }`}
                >
                  {col.label}
                  <SortIcon col={col} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-6 text-center text-sm text-gray-500"
                >
                  No data found
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-800 transition-colors hover:bg-gray-800/40"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-4 py-2 text-sm text-gray-300"
                    >
                      {row[col.key] != null ? String(row[col.key]) : '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-700 px-4 py-2">
          <span className="text-xs text-gray-500">
            {sorted.length} result{sorted.length !== 1 ? 's' : ''} — page{' '}
            {safePage + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <FaChevronLeft className="text-xs" />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, idx) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = idx;
              } else if (safePage < 4) {
                pageNum = idx;
              } else if (safePage > totalPages - 5) {
                pageNum = totalPages - 7 + idx;
              } else {
                pageNum = safePage - 3 + idx;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`min-w-[28px] rounded px-1.5 py-1 text-xs transition-colors ${
                    pageNum === safePage
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }`}
                >
                  {pageNum + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <FaChevronRight className="text-xs" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
