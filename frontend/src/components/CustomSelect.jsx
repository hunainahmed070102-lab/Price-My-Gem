import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Custom themed dropdown replacing browser-native <select> elements.
 * Supports desktop & mobile touch interaction, outside click close, and Escape key.
 */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  size = 'md', // 'md' | 'sm'
  align = 'left', // 'left' | 'right'
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const normalizedOptions = options.map((opt) =>
    typeof opt === 'object' && opt !== null
      ? { value: String(opt.value), label: String(opt.label) }
      : { value: String(opt), label: String(opt) }
  );

  const selectedOption = normalizedOptions.find(
    (opt) => opt.value === String(value ?? '')
  );

  useEffect(() => {
    if (!open) return undefined;

    const handleOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleSelect = (optionValue) => {
    setOpen(false);
    if (onChange) {
      onChange(optionValue);
    }
  };

  const triggerPadding =
    size === 'sm' ? 'px-3 py-1.5 text-[13px]' : 'px-3 py-2 text-[13px]';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border bg-white text-left font-medium outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${triggerPadding} ${
          open
            ? 'border-[#6B58D6]'
            : 'border-[#E5E7EB] hover:border-[#D1D5DB]'
        }`}
      >
        <span
          className={`truncate ${
            selectedOption ? 'text-[#111827]' : 'text-[#9CA3AF]'
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={15}
          className={`shrink-0 text-[#6B7280] transition-transform duration-150 ${
            open ? 'rotate-180 text-[#6B58D6]' : ''
          }`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className={`no-scrollbar absolute z-50 mt-1.5 max-h-60 min-w-full overflow-y-auto overflow-x-hidden rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-lg font-['Roboto_Condensed',sans-serif] ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {normalizedOptions.length === 0 ? (
            <li className="px-3 py-2 text-center text-[12.5px] text-[#6B7280]">
              No results found
            </li>
          ) : (
            normalizedOptions.map((opt) => {
              const isSelected = opt.value === String(value ?? '');
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt.value)}
                  className={`flex cursor-pointer items-center px-3 py-2 text-[13px] transition-colors ${
                    isSelected
                      ? 'bg-[#6B58D6] font-semibold text-white'
                      : 'text-[#374151] hover:bg-[#F5F3FF] hover:text-[#6B58D6]'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
