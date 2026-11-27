import React from 'react';
import { ChevronLeft, ChevronRight, Search, ArrowUpDown } from 'lucide-react';

export interface TableControlsProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  sortBy?: string;
  sortOptions?: Array<{ label: string; value: string }>;
  onSortChange?: (value: string) => void;
  rightSlot?: React.ReactNode;
}

export const SearchSortBar: React.FC<TableControlsProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  sortBy,
  sortOptions,
  onSortChange,
  rightSlot,
}) => (
  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
    <div className="relative flex-1">
      <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        className="w-full bg-charcoal-900 border border-subtle rounded-lg pl-9 pr-4 py-2 text-xs text-ivory-100 placeholder:text-charcoal-500 focus:outline-none focus:border-forest-500/50"
      />
    </div>
    <div className="flex items-center gap-2 flex-wrap">
      {sortOptions && onSortChange && (
        <div className="flex items-center gap-1.5 bg-charcoal-900 border border-subtle rounded-lg px-2.5 py-1.5 text-xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-charcoal-400" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-transparent text-ivory-100 focus:outline-none text-xs font-mono cursor-pointer"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-charcoal-900 text-ivory-100">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}
      {rightSlot}
    </div>
  </div>
);

export const PaginationBar: React.FC<{
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (nextPage: number) => void;
}> = ({ page, totalPages, totalItems, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-3 text-xs font-mono text-charcoal-400">
      <span>
        Showing page <strong className="text-ivory-100">{page}</strong> of{' '}
        <strong className="text-ivory-100">{totalPages}</strong> ({totalItems} total)
      </span>
      <div className="flex items-center gap-1.5">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-2.5 py-1 rounded-lg bg-charcoal-900 border border-subtle text-ivory-200 disabled:opacity-40 hover:border-refined flex items-center gap-1"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Prev
        </button>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-2.5 py-1 rounded-lg bg-charcoal-900 border border-subtle text-ivory-200 disabled:opacity-40 hover:border-refined flex items-center gap-1"
        >
          Next <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
