import React from 'react';
import { StateMessage } from './StateMessage';

/* ═══ Design System ═══ */
const C = {
  primary: '#6B58D6',
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  white: '#FFFFFF',
  hover: '#F5F3FF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
};

/* ═══ Professional Data Table Component ═══ */
export default function DataTable({
  columns,
  data,
  loading = false,
  error = '',
  emptyMessage = 'No results found',
}) {
  if (loading || error || !data || data.length === 0) {
    return (
      <div
        style={{
          background: C.white,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
        }}
      >
        <StateMessage
          loading={loading}
          error={error}
          emptyMessage={emptyMessage}
        />
      </div>
    );
  }

  return (
    <div style={{
      background: C.white,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      overflow: 'hidden'
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: "'Roboto Condensed', sans-serif"
        }}>
          <thead>
            <tr style={{
              background: C.white,
              borderBottom: `1px solid ${C.border}`
            }}>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  style={{
                    padding: '14px 16px',
                    textAlign: col.align || 'left',
                    fontSize: 12,
                    fontWeight: 600,
                    color: C.textPrimary,
                    letterSpacing: '0.3px',
                    borderRight: idx < columns.length - 1 ? `1px solid ${C.borderLight}` : 'none',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                style={{
                  borderBottom: rowIdx < data.length - 1 ? `1px solid ${C.borderLight}` : 'none',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.hover}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    style={{
                      padding: '14px 16px',
                      fontSize: 13,
                      fontWeight: 400,
                      color: C.textSecondary,
                      borderRight: colIdx < columns.length - 1 ? `1px solid ${C.borderLight}` : 'none',
                      textAlign: col.align || 'left'
                    }}
                  >
                    {col.render ? col.render(row) : row[col.field]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
