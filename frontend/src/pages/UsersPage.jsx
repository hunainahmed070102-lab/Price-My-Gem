import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  X,
} from 'lucide-react';
import { adminService } from '../services/api';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import { TableStateRow } from '../components/StateMessage';

/* Clean White Citizen Profile Details Modal */
function ViewUserModal({ user, onClose }) {
  if (!user) return null;

  const dateValue = user.created_at || user.createdAt;
  const formattedDate = dateValue
    ? new Date(dateValue).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    : '—';

  const lastScanDate = user.last_scan_at
    ? new Date(user.last_scan_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    : '—';

  const scanCount = Number(user.report_count ?? 0);
  const activityText =
    scanCount === 0
      ? 'No scans yet'
      : `${scanCount} ${scanCount === 1 ? 'Scan Submitted' : 'Scans Submitted'}`;

  const isActive = String(user.status || 'active').toLowerCase() === 'active';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 font-['Roboto_Condensed',sans-serif] animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="no-scrollbar w-full max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
          <h3 className="text-[17px] font-bold text-[#111827]">
            Citizen Profile Details
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

        <div className="py-5 space-y-4 text-[13.5px]">
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Account Information
            </div>
            <div className="divide-y divide-[#F3F4F6] text-[13px]">
              <div className="flex items-center justify-between gap-4 py-2">
                <span className="text-[#6B7280]">Full Name</span>
                <span className="font-semibold text-[#111827] text-right">
                  {user.full_name || user.name || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 py-2">
                <span className="text-[#6B7280] shrink-0">Email Address</span>
                <span className="font-semibold text-[#111827] text-right break-all">
                  {user.email || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 py-2">
                <span className="text-[#6B7280]">Citizen ID</span>
                <span className="font-semibold text-[#111827]">#{user.id}</span>
              </div>
              <div className="flex items-center justify-between gap-4 py-2">
                <span className="text-[#6B7280]">Account Status</span>
                <StatusBadge
                  status={isActive ? 'Active' : 'Blocked'}
                  size="sm"
                  showIcon={false}
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Verification
            </div>
            <div className="divide-y divide-[#F3F4F6] text-[13px]">
              <div className="flex items-center justify-between gap-4 py-2">
                <span className="text-[#6B7280]">Registration Date</span>
                <span className="font-semibold text-[#111827]">{formattedDate}</span>
              </div>
              <div className="flex items-center justify-between gap-4 py-2">
                <span className="text-[#6B7280]">Email Verification</span>
                <span className="font-semibold text-[#15803D]">OTP Verified</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Activity
            </div>
            <div className="divide-y divide-[#F3F4F6] text-[13px]">
              <div className="flex items-center justify-between gap-4 py-2">
                <span className="text-[#6B7280]">Appraisal Activity</span>
                <span className="font-semibold text-[#111827]">{activityText}</span>
              </div>
              <div className="flex items-center justify-between gap-4 py-2">
                <span className="text-[#6B7280]">Last Scan Date</span>
                <span className="font-semibold text-[#111827]">{lastScanDate}</span>
              </div>
            </div>
          </div>
        </div>

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

export default function UsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [viewingUser, setViewingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getUsers();
      if (response && response.success && Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        setUsers([]);
        setError('Failed to load users.');
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to load users.');
      toast.error('Failed to load users directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleUserStatus = async (user) => {
    const uid = String(user.id || '');
    const currentStatus = String(user.status || 'active').toLowerCase();
    const nextStatus = currentStatus === 'active' ? 'blocked' : 'active';

    setUpdatingStatus(true);
    try {
      await adminService.updateUserStatus(uid, nextStatus);
      setUsers((prev) =>
        prev.map((u) => (String(u.id) === uid ? { ...u, status: nextStatus } : u))
      );
      if (nextStatus === 'blocked') {
        toast.success(`${user.email} has been blocked.`);
      } else {
        toast.success(`${user.email} is now active.`);
      }
    } catch (error) {
      console.error('Status update error:', error);
      toast.error('Failed to update user status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser || deleting) return;
    setDeleting(true);
    try {
      const response = await adminService.deleteUser(deletingUser.id);
      if (response && response.success) {
        setUsers((prev) => prev.filter((u) => String(u.id) !== String(deletingUser.id)));
        toast.success(`${deletingUser.email} deleted.`);
        setDeletingUser(null);
      } else {
        toast.error(response?.message || 'Failed to delete user.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const list = Array.isArray(users) ? users : [];
    const term = String(searchTerm || '').toLowerCase();
    return list.filter((u) => {
      if (!u) return false;
      const name = String(u.full_name || u.name || '').toLowerCase();
      const email = String(u.email || '').toLowerCase();
      const matchesSearch = name.includes(term) || email.includes(term);

      if (!matchesSearch) return false;
      const status = String(u.status || 'active').toLowerCase();
      if (statusFilter === 'active') return status === 'active';
      if (statusFilter === 'blocked') return status === 'blocked';
      return true;
    });
  }, [users, searchTerm, statusFilter]);

  const totalCount = users.length;
  const activeCount = users.filter(
    (u) => String(u?.status || 'active').toLowerCase() === 'active'
  ).length;
  const blockedCount = users.filter(
    (u) => String(u?.status || '').toLowerCase() === 'blocked'
  ).length;

  return (
    <div className="space-y-6 font-['Roboto_Condensed',sans-serif]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[24px] font-bold tracking-tight text-[#111827]">
          Users <span className="text-[#6B58D6]">Management</span>
        </h1>
      </div>

      {/* Search & Status Filter */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="group relative flex-1 min-w-[260px] max-w-md">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] transition-colors group-focus-within:text-[#6B58D6]"
          />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 pl-10 pr-4 text-[13.5px] text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-colors focus:border-[#6B58D6]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
          {[
            { key: 'all', label: `All (${totalCount})` },
            { key: 'active', label: `Active (${activeCount})` },
            { key: 'blocked', label: `Blocked (${blockedCount})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`cursor-pointer rounded-lg border px-3.5 py-1.5 font-semibold transition-colors duration-150 ${
                statusFilter === tab.key
                  ? 'border-[#6B58D6] bg-[#6B58D6] text-white'
                  : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#6B58D6] hover:text-[#6B58D6]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-[#E5E7EB] bg-white text-[11.5px] font-semibold uppercase tracking-wider text-[#6B7280]">
              <tr>
                <th className="px-6 py-3.5">Citizen Name</th>
                <th className="px-6 py-3.5">Email Address</th>
                <th className="px-6 py-3.5">Scans</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Joined Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-[#374151]">
              {loading || error || filteredUsers.length === 0 ? (
                <TableStateRow
                  colSpan={6}
                  loading={loading}
                  error={error}
                  emptyMessage={
                    searchTerm.trim() || (statusFilter !== 'all' && users.length > 0)
                      ? 'No results found'
                      : 'No users found'
                  }
                />
              ) : (
                filteredUsers.map((user, idx) => {
                  const uid = user.id || idx;
                  const isActive =
                    String(user.status || 'active').toLowerCase() === 'active';
                  const dateStr = user.created_at || user.createdAt;
                  const formattedDate = dateStr
                    ? new Date(dateStr).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                    : '—';

                  return (
                    <tr key={uid} className="hover:bg-[#F5F3FF] transition-colors duration-150">
                      <td className="px-6 py-3.5 font-bold text-[#111827]">
                        {user.full_name || user.name || '—'}
                      </td>
                      <td className="px-6 py-3.5 text-[#4B5563]">
                        {user.email}
                      </td>
                      <td className="px-6 py-3.5 font-medium text-[#111827]">
                        {Number(user.report_count ?? 0)}
                      </td>
                      <td className="px-6 py-3.5">
                        <button
                          type="button"
                          onClick={() => handleToggleUserStatus(user)}
                          disabled={updatingStatus}
                          title={isActive ? 'Click to block' : 'Click to activate'}
                          className="cursor-pointer transition-opacity hover:opacity-80 disabled:opacity-50"
                        >
                          <StatusBadge
                            status={isActive ? 'Active' : 'Blocked'}
                            size="sm"
                            showIcon={false}
                          />
                        </button>
                      </td>
                      <td className="px-6 py-3.5 text-[#6B7280]">
                        {formattedDate}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setViewingUser(user)}
                            className="cursor-pointer rounded-md border border-[#E5E7EB] bg-white px-3 py-1 text-[12px] font-semibold text-[#374151] transition-colors hover:border-[#6B58D6] hover:text-[#6B58D6]"
                          >
                            View
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingUser(user)}
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

      {/* View Modal */}
      {viewingUser && (
        <ViewUserModal
          user={viewingUser}
          onClose={() => setViewingUser(null)}
        />
      )}

      {/* Delete Confirm Modal */}
      {deletingUser && (
        <ConfirmModal
          isOpen={!!deletingUser}
          title="Delete User"
          message={`Delete account ${deletingUser.email} permanently?`}
          confirmText="Delete"
          confirmType="danger"
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeletingUser(null)}
        />
      )}
    </div>
  );
}
