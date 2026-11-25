import React from 'react';
import { X, Loader2 } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmType = 'danger', // 'danger' | 'primary'
  onConfirm,
  onClose,
  loading = false,
}) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 font-['Roboto_Condensed',sans-serif] animate-in fade-in duration-150"
      onClick={loading ? undefined : onClose}
    >
      <div
        className="no-scrollbar w-full max-w-md max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-[17px] font-bold text-[#111827]">
            {title}
          </h3>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-white text-[#374151] transition-all duration-150 hover:bg-[#DC2626] hover:text-white disabled:opacity-50"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <p className="mt-3 text-[14px] leading-relaxed text-[#4B5563]">
          {message}
        </p>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#F3F4F6] pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="cursor-pointer rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-[13px] font-semibold text-[#374151] transition-colors hover:bg-[#F9FAFB] disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold text-white shadow-xs transition-colors duration-150 disabled:opacity-60 ${
              confirmType === 'danger'
                ? 'bg-[#DC2626] hover:bg-[#B91C1C] hover:text-white'
                : 'bg-[#6B58D6] hover:bg-[#5845C2]'
            }`}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            <span>{loading ? 'Processing...' : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
