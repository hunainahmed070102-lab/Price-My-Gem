import React from 'react';

/**
 * Shared text-only loading, error, and empty state message used consistently
 * across all dashboard cards, lists, charts, and tables.
 */
export function StateMessage({
  loading = false,
  error = '',
  emptyMessage = 'No records found',
  className = 'py-12',
}) {
  return (
    <div
      className={`flex w-full items-center justify-center px-4 text-center font-['Roboto_Condensed',sans-serif] text-[13.5px] font-medium ${
        error ? 'text-[#DC2626]' : 'text-[#6B7280]'
      } ${className}`}
    >
      {loading ? 'Loading...' : error ? error : emptyMessage}
    </div>
  );
}

/**
 * Table-row wrapper around StateMessage for consistent tbody states.
 */
export function TableStateRow({
  colSpan,
  loading = false,
  error = '',
  emptyMessage = 'No records found',
  className = 'py-12',
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-0">
        <StateMessage
          loading={loading}
          error={error}
          emptyMessage={emptyMessage}
          className={className}
        />
      </td>
    </tr>
  );
}
