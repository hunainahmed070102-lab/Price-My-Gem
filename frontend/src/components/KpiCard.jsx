import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendType = 'up', // 'up' | 'down' | 'neutral'
  badge,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-xs transition-all duration-150 ${
        onClick ? 'cursor-pointer hover:border-[#D1D5DB] hover:shadow-sm' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-3">
          <p className="text-[12px] font-semibold tracking-wider text-[#6B7280] uppercase truncate">
            {title}
          </p>
          <div className="mt-2 text-[28px] font-bold tracking-tight text-[#111827] leading-tight">
            {value}
          </div>
        </div>

        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#6B58D6]">
            <Icon size={19} strokeWidth={2} />
          </div>
        )}
      </div>

      <div className="mt-3.5 flex flex-nowrap items-center justify-between gap-2 border-t border-[#F3F4F6] pt-3 text-[12px]">
        {subtitle && (
          <span className="min-w-0 truncate text-[#6B7280]">
            {subtitle}
          </span>
        )}

        {trend && (
          <div
            className={`inline-flex shrink-0 whitespace-nowrap items-center gap-1 font-semibold ${
              trendType === 'up'
                ? 'text-[#15803D]'
                : trendType === 'down'
                ? 'text-[#DC2626]'
                : 'text-[#4B5563]'
            }`}
          >
            {trendType === 'up' && <TrendingUp size={13} />}
            {trendType === 'down' && <TrendingDown size={13} />}
            <span>{trend}</span>
          </div>
        )}

        {badge && (
          <span className="inline-flex shrink-0 whitespace-nowrap rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 py-0.5 text-[11px] font-semibold text-[#6B58D6]">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
