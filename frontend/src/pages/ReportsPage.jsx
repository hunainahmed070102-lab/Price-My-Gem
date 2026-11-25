import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  X,
} from 'lucide-react';
import { adminService } from '../services/api';
import { SERVER_BASE_URL } from '../utils/config';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import { TableStateRow } from '../components/StateMessage';

function formatConfidence(val) {
  if (val === null || val === undefined || val === '') return '—';
  const num = Number(val);
  if (!Number.isFinite(num)) return String(val);
  const pct = num <= 1 ? num * 100 : num;
  return `${Math.round(pct)}%`;
}

/* Report Detail Modal — clean specimen & report details without unnecessary review fields */
function ReportDetailModal({ report, onClose }) {
  if (!report) return null;

  const fullImageUrl = report.image_url
    ? report.image_url.startsWith('http')
      ? report.image_url
      : `${SERVER_BASE_URL}${report.image_url}`
    : '';

  const rawDate = report.created_at || report.createdAt;
  const formattedDate = rawDate
    ? new Date(rawDate).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    : '—';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 font-['Roboto_Condensed',sans-serif] animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="no-scrollbar w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
          <h3 className="text-[17px] font-bold text-[#111827]">
            Report #{report.id}
          </h3>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-white text-[#374151] transition-all duration-150 hover:bg-[#DC2626] hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="py-5 text-[13.5px]">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-12 sm:items-stretch">
            {/* Image */}
            <div className="sm:col-span-4 flex">
              <div className="h-56 sm:h-full w-full overflow-hidden rounded-lg border border-[#E5E7EB] bg-white p-2 flex items-center justify-center">
                {fullImageUrl ? (
                  <img
                    src={fullImageUrl}
                    alt={report.gemstone_type || 'Gemstone'}
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-[12px] text-[#9CA3AF]">No image</span>
                )}
              </div>
            </div>

            {/* Report & Gemstone Details */}
            <div className="sm:col-span-8 rounded-lg border border-[#E5E7EB] bg-white p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-[11.5px] font-semibold text-[#6B7280] uppercase">
                    Citizen Reporter
                  </div>
                  <div className="mt-1 font-semibold text-[#111827] break-all">
                    {report.user_email || report.user_name || '—'}
                  </div>
                </div>

                <div>
                  <div className="text-[11.5px] font-semibold text-[#6B7280] uppercase">
                    Gemstone Identified
                  </div>
                  <div className="mt-1 font-bold text-[#6B58D6]">
                    {report.gemstone_type || '—'}
                  </div>
                </div>

                <div>
                  <div className="text-[11.5px] font-semibold text-[#6B7280] uppercase">
                    AI Confidence
                  </div>
                  <div className="mt-1 font-semibold text-[#111827]">
                    {formatConfidence(report.confidence)}
                  </div>
                </div>

                <div>
                  <div className="text-[11.5px] font-semibold text-[#6B7280] uppercase">
                    Estimated Price
                  </div>
                  <div className="mt-1 font-semibold text-[#111827]">
                    {report.price_range || '—'}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <div className="text-[11.5px] font-semibold text-[#6B7280] uppercase">
                    Submitted Date
                  </div>
                  <div className="mt-1 font-medium text-[#374151]">
                    {formattedDate}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[#E5E7EB] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-[13px] font-semibold text-[#374151] transition-colors duration-150 hover:border-[#DC2626] hover:bg-[#DC2626] hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const toast = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [authTab, setAuthTab] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [deletingReport, setDeletingReport] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getReports();
      if (response && response.success && Array.isArray(response.data)) {
        setReports(response.data);
      } else {
        setReports([]);
        setError('Failed to load reports.');
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
      setReports([]);
      setError('Failed to load reports.');
      toast.error('Failed to load reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleConfirmDelete = async () => {
    if (!deletingReport || deleting) return;
    setDeleting(true);
    try {
      const response = await adminService.deleteReport(deletingReport.id);
      if (response && response.success) {
        setReports((prev) => prev.filter((r) => r.id !== deletingReport.id));
        toast.success(`Report #${deletingReport.id} deleted.`);
        setDeletingReport(null);
      } else {
        toast.error(response?.message || 'Failed to delete report.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete report.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredReports = useMemo(() => {
    const term = String(searchTerm || '').toLowerCase().trim();
    return (Array.isArray(reports) ? reports : []).filter((r) => {
      if (!r) return false;
      const id = String(r.id ?? '').toLowerCase();
      const gem = String(r.gemstone_type || '').toLowerCase();
      const email = String(r.user_email || r.user_name || '').toLowerCase();

      if (term && !id.includes(term) && !gem.includes(term) && !email.includes(term)) {
        return false;
      }

      if (authTab !== 'all') {
        const auth = String(r.authenticity || 'uncertain').toLowerCase();
        if (auth !== authTab) return false;
      }

      return true;
    });
  }, [reports, searchTerm, authTab]);

  const counts = useMemo(() => {
    const base = { all: reports.length, real: 0, synthetic: 0, uncertain: 0 };
    for (const r of reports) {
      const key = String(r.authenticity || 'uncertain').toLowerCase();
      if (key in base) base[key] += 1;
    }
    return base;
  }, [reports]);

  return (
    <div className="space-y-6 font-['Roboto_Condensed',sans-serif]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[24px] font-bold tracking-tight text-[#111827]">
          Citizen <span className="text-[#6B58D6]">Reports</span>
        </h1>
      </div>

      {/* Search & Filter Bar */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="group relative flex-1 min-w-[260px] max-w-md">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] transition-colors group-focus-within:text-[#6B58D6]"
          />
          <input
            type="text"
            placeholder="Search report ID, citizen email, or gemstone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 pl-10 pr-4 text-[13.5px] text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-colors focus:border-[#6B58D6]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
          {[
            { key: 'all', label: `All (${counts.all})` },
            { key: 'real', label: `Real (${counts.real})` },
            { key: 'synthetic', label: `Synthetic (${counts.synthetic})` },
            { key: 'uncertain', label: `Uncertain (${counts.uncertain})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setAuthTab(tab.key)}
              className={`cursor-pointer rounded-lg border px-3.5 py-1.5 font-semibold transition-colors duration-150 ${authTab === tab.key
                ? 'border-[#6B58D6] bg-[#6B58D6] text-white'
                : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#6B58D6] hover:text-[#6B58D6]'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Table (Review column removed) */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-[#E5E7EB] bg-white text-[11.5px] font-semibold uppercase tracking-wider text-[#6B7280]">
              <tr>
                <th className="px-6 py-3.5">Report ID</th>
                <th className="px-6 py-3.5">Reporter</th>
                <th className="px-6 py-3.5">Gemstone</th>
                <th className="px-6 py-3.5">Confidence</th>
                <th className="px-6 py-3.5">Estimated Rate</th>
                <th className="px-6 py-3.5">Authenticity</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-[#374151]">
              {loading || error || filteredReports.length === 0 ? (
                <TableStateRow
                  colSpan={8}
                  loading={loading}
                  error={error}
                  emptyMessage={
                    searchTerm.trim() || (authTab !== 'all' && reports.length > 0)
                      ? 'No results found'
                      : 'No reports found'
                  }
                />
              ) : (
                filteredReports.map((report) => {
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
                      <td className="px-6 py-3.5 font-bold text-[#111827]">
                        #{report.id}
                      </td>
                      <td className="px-6 py-3.5 text-[#374151]">
                        {report.user_email || report.user_name || '—'}
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-[#6B58D6]">
                        {report.gemstone_type || '—'}
                      </td>
                      <td className="px-6 py-3.5 font-medium text-[#111827]">
                        {formatConfidence(report.confidence)}
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
                      <td className="px-6 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedReport(report)}
                            className="cursor-pointer rounded-md border border-[#E5E7EB] bg-white px-3 py-1 text-[12px] font-semibold text-[#374151] transition-colors hover:border-[#6B58D6] hover:text-[#6B58D6]"
                          >
                            Review
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingReport(report)}
                            className="cursor-pointer rounded-md border border-[#E5E7EB] bg-white px-3 py-1 text-[12px] font-semibold text-[#DC2626] transition-colors hover:border-[#FECACA] hover:bg-[#FEF2F2]"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingReport && (
        <ConfirmModal
          isOpen={!!deletingReport}
          title="Delete Report"
          message={`Delete Report #${deletingReport.id} (${deletingReport.gemstone_type}) permanently?`}
          confirmText="Delete"
          confirmType="danger"
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeletingReport(null)}
        />
      )}
    </div>
  );
}
