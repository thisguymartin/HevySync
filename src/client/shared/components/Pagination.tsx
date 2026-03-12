interface PaginationProps {
  page: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, hasPrevPage, hasNextPage, isLoading, onPageChange }: PaginationProps) {
  if (!hasPrevPage && !hasNextPage) return null;

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPrevPage || isLoading}
        className="px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-800 rounded-lg disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        Previous
      </button>
      <span className="text-sm text-gray-500">Page {page}</span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNextPage || isLoading}
        className="px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-800 rounded-lg disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        Next
      </button>
    </div>
  );
}
