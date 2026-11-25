import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  FileText,
  Gem,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { adminService } from '../services/api';
import KpiCard from '../components/KpiCard';
import StatusBadge from '../components/StatusBadge';
import { StateMessage, TableStateRow } from '../components/StateMessage';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white p-3 shadow-md font-['Roboto_Condensed',sans-serif]">
      <div className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
        {label}
      </div>
      <div className="mt-1 text-[16px] font-bold text-[#6B58D6]">
        {payload[0].value}{' '}
        <span className="text-[12px] font-normal text-[#6B7280]">
          {payload[0].value === 1 ? 'report' : 'reports'}
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartPeriod, setChartPeriod] = useState('weekly');

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError('');
        const [statsRes, reportsRes, usersRes, pricesRes] = await Promise.all([
          adminService.getStatistics().catch(() => ({ success: false })),
          adminService.getReports().catch(() => ({ success: false })),
          adminService.getUsers().catch(() => ({ success: false })),
          adminService.getPrices().catch(() => ({ success: false })),
        ]);

        const anySuccess =
          statsRes?.success || reportsRes?.success || usersRes?.success || pricesRes?.success;

        if (!anySuccess) {
          setError('Failed to load dashboard data.');
          return;
        }

        if (statsRes?.success) setStats(statsRes.data);
        if (reportsRes?.success && Array.isArray(reportsRes.data)) setReports(reportsRes.data);
        if (usersRes?.success && Array.isArray(usersRes.data)) setUsers(usersRes.data);
        if (pricesRes?.success && Array.isArray(pricesRes.data)) setPrices(pricesRes.data);
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const totalUsers = stats?.totalUsers ?? users.length;
  const activeUsers =
    stats?.activeUsers ??
    users.filter((u) => String(u.status || 'active').toLowerCase() === 'active').length;
  const totalReports = stats?.totalReports ?? reports.length;
  const totalPrices = stats?.totalPrices ?? prices.length;

  const realAuthCount =
    stats?.authenticityBreakdown?.real ??
    reports.filter((r) => String(r.authenticity || '').toLowerCase() === 'real').length;

  const activeRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

  const chartData = useMemo(() => {
    const raw =
      chartPeriod === 'monthly'
        ? stats?.dailyActivity30d
        : stats?.dailyActivity7d;

    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((d) => ({
        name: d.name,
        submissions: Number(d.scans || 0),
      }));
    }
    return [];
  }, [stats, chartPeriod]);

  const topBenchmarks = useMemo(() => {
    if (!Array.isArray(prices) || prices.length === 0) return [];
    return [...prices]
      .sort((a, b) => Number(b.price_per_carat || 0) - Number(a.price_per_carat || 0))
      .slice(0, 5);
  }, [prices]);

  const recentReports = useMemo(() => {
    if (!Array.isArray(reports)) return [];
    return reports.slice(0, 5);
  }, [reports]);

  return (
    <div className="space-y-6 font-['Roboto_Condensed',sans-serif]">
      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[24px] font-bold tracking-tight text-[#111827]">
          Dashboard <span className="text-[#6B58D6]">Overview</span>
        </h1>
      </div>

      {/* 4-Column KPI Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Citizens"
          value={loading ? '—' : totalUsers.toLocaleString()}
          subtitle="Registered accounts"
          icon={Users}
          trend={loading ? '' : `${activeUsers} active`}
          trendType="up"
          onClick={() => navigate('/users')}
        />

        <KpiCard
          title="Gemstone Catalog"
          value={loading ? '—' : totalPrices.toLocaleString()}
          subtitle="Price varieties"
          icon={Gem}
          trend={loading ? '' : `${totalPrices} listed`}
          trendType="neutral"
          onClick={() => navigate('/gems')}
        />

        <KpiCard
          title="Appraisal Reports"
          value={loading ? '—' : totalReports.toLocaleString()}
          subtitle="Submitted scans"
          icon={FileText}
          trend={loading ? '' : `${realAuthCount} real`}
          trendType="up"
          onClick={() => navigate('/reports')}
        />

        <KpiCard
          title="Active Citizens"
          value={loading ? '—' : activeUsers.toLocaleString()}
          subtitle="Account standing"
          icon={ShieldCheck}
          trend={loading ? '' : `${activeRate}% active`}
          trendType="up"
          onClick={() => navigate('/users')}
        />
      </div>

      {/* Main Analytics Grid: AreaChart + Price Benchmarks */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (8 cols): AreaChart */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-xs lg:col-span-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-[16px] font-bold text-[#111827]">
              Scan & Report Activity
            </h2>

            <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
              {[
                { key: 'weekly', label: 'Past 7 Days' },
                { key: 'monthly', label: 'Past 30 Days' },
              ].map((period) => (
                <button
                  key={period.key}
                  type="button"
                  onClick={() => setChartPeriod(period.key)}
                  className={`cursor-pointer rounded-lg border px-3.5 py-1.5 font-semibold transition-colors duration-150 ${
                    chartPeriod === period.key
                      ? 'border-[#6B58D6] bg-[#6B58D6] text-white'
                      : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#6B58D6] hover:text-[#6B58D6]'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[260px] w-full">
            {loading || error || chartData.length === 0 ? (
              <StateMessage
                loading={loading}
                error={error}
                emptyMessage="No reports found"
                className="h-full"
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6B58D6" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#6B58D6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="submissions"
                    stroke="#6B58D6"
                    strokeWidth={2.2}
                    fillOpacity={1}
                    fill="url(#purpleGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Top Price Benchmarks (White surface) */}
        <div className="flex flex-col rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-xs lg:col-span-4">
          <div className="mb-4 flex items-center justify-between border-b border-[#F3F4F6] pb-3">
            <h2 className="text-[16px] font-bold text-[#111827]">
              Price Benchmarks
            </h2>
            <button
              type="button"
              onClick={() => navigate('/gems')}
              className="cursor-pointer text-[12px] font-semibold text-[#6B58D6] hover:underline"
            >
              View All
            </button>
          </div>

          <div className="divide-y divide-[#F3F4F6] text-[13px] flex-1">
            {loading || error || topBenchmarks.length === 0 ? (
              <StateMessage
                loading={loading}
                error={error}
                emptyMessage="No gemstones found"
                className="py-10"
              />
            ) : (
              topBenchmarks.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-[#111827] truncate">
                      {item.gemstone_type}
                    </div>
                    <div className="text-[11px] text-[#6B7280] truncate">
                      {item.mineral_family || 'Gemstone'}
                      {item.mohs_hardness ? ` • ${item.mohs_hardness} Mohs` : ''}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-[#6B58D6]">
                      {item.currency || 'PKR'} {Number(item.price_per_carat || 0).toLocaleString()}
                    </div>
                    <div className="text-[10.5px] text-[#6B7280]">per carat</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Citizen Inquiries & Reports Table */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
        <div className="flex flex-wrap items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
          <h2 className="text-[16px] font-bold text-[#111827]">
            Recent Citizen Inquiries & Reports
          </h2>

          <button
            type="button"
            onClick={() => navigate('/reports')}
            className="inline-flex cursor-pointer items-center gap-1 text-[13px] font-semibold text-[#6B58D6] hover:underline"
          >
            <span>View All</span>
            <ChevronRight size={15} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-[#E5E7EB] bg-white text-[11.5px] font-semibold uppercase tracking-wider text-[#6B7280]">
              <tr>
                <th className="px-6 py-3">Report ID</th>
                <th className="px-6 py-3">Citizen</th>
                <th className="px-6 py-3">Gemstone</th>
                <th className="px-6 py-3">Estimated Rate</th>
                <th className="px-6 py-3">Authenticity</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-[#374151]">
              {loading || error || recentReports.length === 0 ? (
                <TableStateRow
                  colSpan={7}
                  loading={loading}
                  error={error}
                  emptyMessage="No reports found"
                  className="py-10"
                />
              ) : (
                recentReports.map((report) => {
                  const dateStr = report.created_at || report.createdAt;
                  const formattedDate = dateStr
                    ? new Date(dateStr).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—';

                  return (
                    <tr key={report.id} className="hover:bg-[#F5F3FF] transition-colors duration-150">
                      <td className="px-6 py-3.5 font-semibold text-[#111827]">
                        #{report.id}
                      </td>
                      <td className="px-6 py-3.5 font-medium text-[#111827]">
                        {report.user_email || report.user_name || '—'}
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-[#6B58D6]">
                        {report.gemstone_type || '—'}
                      </td>
                      <td className="px-6 py-3.5 text-[#4B5563]">
                        {report.price_range || '—'}
                      </td>
                      <td className="px-6 py-3.5">
                        <StatusBadge
                          status={report.authenticity || 'uncertain'}
                          size="sm"
                          showIcon={false}
                        />
                      </td>
                      <td className="px-6 py-3.5 text-[#6B7280]">
                        {formattedDate}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => navigate('/reports')}
                          className="cursor-pointer rounded-md border border-[#E5E7EB] bg-white px-3 py-1 text-[12px] font-semibold text-[#374151] transition-colors hover:border-[#6B58D6] hover:text-[#6B58D6]"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
