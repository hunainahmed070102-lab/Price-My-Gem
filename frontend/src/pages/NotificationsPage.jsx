import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  X,
} from 'lucide-react';
import { adminService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { TableStateRow } from '../components/StateMessage';

const getCategoryColor = (cat) => {
  const lower = String(cat || '').toLowerCase();
  if (lower.includes('report')) return 'text-[#DC2626]';
  if (lower.includes('catalog') || lower.includes('price')) return 'text-[#15803D]';
  if (lower.includes('user')) return 'text-[#6B58D6]';
  return 'text-[#374151]';
};

function notifyUnreadCount(unreadCount) {
  window.dispatchEvent(
    new CustomEvent('pmg-notifs-updated', { detail: { unreadCount } })
  );
}

export default function NotificationsPage() {
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingItem, setViewingItem] = useState(null);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await adminService.getNotifications();
        if (!res?.success) {
          setError('Failed to load notifications.');
          return;
        }
        const list = Array.isArray(res.data) ? res.data : [];
        setNotifications(list);
        const unread = typeof res?.unreadCount === 'number'
          ? res.unreadCount
          : list.filter((n) => !n.read).length;
        notifyUnreadCount(unread);
      } catch (err) {
        console.error('Failed to load notifications:', err);
        setError('Failed to load notifications.');
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    const prevList = notifications;
    const nextList = prevList.map((n) => (n.id === id ? { ...n, read: true } : n));
    setNotifications(nextList);
    const optimisticUnread = nextList.filter((n) => !n.read).length;
    notifyUnreadCount(optimisticUnread);

    try {
      const res = await adminService.markNotificationRead(id);
      if (typeof res?.data?.unreadCount === 'number') {
        notifyUnreadCount(res.data.unreadCount);
      }
    } catch (error) {
      setNotifications(prevList);
      notifyUnreadCount(prevList.filter((n) => !n.read).length);
      toast.error('Failed to mark notification as read.');
    }
  };

  const handleMarkAllAsRead = async () => {
    const prevList = notifications;
    const nextList = prevList.map((n) => ({ ...n, read: true }));
    setNotifications(nextList);
    notifyUnreadCount(0);

    try {
      await adminService.markAllNotificationsRead();
      toast.success('All notifications marked as read.');
    } catch (error) {
      setNotifications(prevList);
      notifyUnreadCount(prevList.filter((n) => !n.read).length);
      toast.error('Failed to mark all notifications as read.');
    }
  };

  const handleDeleteItem = async (id) => {
    const prevList = notifications;
    const nextList = prevList.filter((n) => n.id !== id);
    setNotifications(nextList);
    if (viewingItem?.id === id) setViewingItem(null);
    notifyUnreadCount(nextList.filter((n) => !n.read).length);

    try {
      const res = await adminService.dismissNotification(id);
      if (typeof res?.data?.unreadCount === 'number') {
        notifyUnreadCount(res.data.unreadCount);
      }
      toast.success('Notification removed.');
    } catch (error) {
      setNotifications(prevList);
      notifyUnreadCount(prevList.filter((n) => !n.read).length);
      toast.error('Failed to delete notification.');
    }
  };

  const handleClearAll = async () => {
    const prevList = notifications;
    setNotifications([]);
    setViewingItem(null);
    notifyUnreadCount(0);

    try {
      await adminService.dismissAllNotifications();
      toast.success('All notifications cleared.');
    } catch (error) {
      setNotifications(prevList);
      notifyUnreadCount(prevList.filter((n) => !n.read).length);
      toast.error('Failed to clear notifications.');
    }
  };

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return notifications.filter((item) => {
      if (filter === 'unread' && item.read) return false;
      if (filter === 'read' && !item.read) return false;

      if (term) {
        const inTitle = String(item.title || '').toLowerCase().includes(term);
        const inMsg = String(item.message || '').toLowerCase().includes(term);
        const inCat = String(item.category || '').toLowerCase().includes(term);
        if (!inTitle && !inMsg && !inCat) return false;
      }

      return true;
    });
  }, [notifications, filter, searchTerm]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const readCount = notifications.filter((n) => n.read).length;

  const formatTimeAgo = (isoString) => {
    if (!isoString) return '—';
    const seconds = Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / 1000));
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6 font-['Roboto_Condensed',sans-serif]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[24px] font-bold tracking-tight text-[#111827]">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <span className="inline-flex items-center rounded-full border border-[#E5E7EB] bg-white px-2.5 py-0.5 text-[12px] font-bold text-[#6B58D6]">
              {unreadCount} Unread
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="cursor-pointer rounded-lg bg-[#6B58D6] px-3.5 py-2 text-[13px] font-semibold text-white shadow-xs transition-colors duration-150 hover:bg-[#5845C2]"
            >
              Mark all as read
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="cursor-pointer rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#6B7280] shadow-xs transition-colors hover:border-[#DC2626] hover:bg-[#DC2626] hover:text-white"
            >
              Clear all
            </button>
          )}
        </div>
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
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 pl-10 pr-4 text-[13.5px] text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-colors focus:border-[#6B58D6]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
          {[
            { key: 'all', label: `All (${notifications.length})` },
            { key: 'unread', label: `Unread (${unreadCount})` },
            { key: 'read', label: `Read (${readCount})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`cursor-pointer rounded-lg border px-3.5 py-1.5 font-semibold transition-colors duration-150 ${
                filter === tab.key
                  ? 'border-[#6B58D6] bg-[#6B58D6] text-white'
                  : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#6B58D6] hover:text-[#6B58D6]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-[#E5E7EB] bg-white text-[11.5px] font-semibold uppercase tracking-wider text-[#6B7280]">
              <tr>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Title</th>
                <th className="px-6 py-3.5">Details</th>
                <th className="px-6 py-3.5">Time</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-[#374151]">
              {loading || error || filtered.length === 0 ? (
                <TableStateRow
                  colSpan={5}
                  loading={loading}
                  error={error}
                  emptyMessage={
                    searchTerm.trim() || (filter !== 'all' && notifications.length > 0)
                      ? 'No results found'
                      : 'No notifications'
                  }
                  className="py-14"
                />
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => {
                      if (!item.read) handleMarkAsRead(item.id);
                      setViewingItem({ ...item, read: true });
                    }}
                    className="bg-white hover:bg-[#F5F3FF] transition-colors duration-150 cursor-pointer"
                  >
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className={`text-[12.5px] font-semibold ${getCategoryColor(item.category)}`}>
                        {item.category || 'System'}
                      </span>
                    </td>

                    <td className="px-6 py-3.5">
                      <div
                        className={`text-[13px] ${!item.read ? 'font-bold text-[#111827]' : 'font-normal text-[#4B5563]'
                          }`}
                      >
                        {item.title}
                      </div>
                    </td>

                    <td className="px-6 py-3.5 max-w-md">
                      <div className="truncate text-[#4B5563] text-[12.5px]" title={item.message}>
                        {item.message}
                      </div>
                    </td>

                    <td className="px-6 py-3.5 whitespace-nowrap text-[#6B7280] text-[12.5px]">
                      {formatTimeAgo(item.timestamp)}
                    </td>

                    <td className="px-6 py-3.5 text-right whitespace-nowrap">
                      <div
                        className="inline-flex items-center justify-end gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!item.read && (
                          <button
                            type="button"
                            onClick={() => handleMarkAsRead(item.id)}
                            className="cursor-pointer rounded-md border border-[#E5E7EB] bg-white px-3 py-1 text-[12px] font-semibold text-[#15803D] transition-colors hover:border-[#DCFCE7] hover:bg-[#F0FDF4]"
                          >
                            Mark as read
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="cursor-pointer rounded-md border border-[#E5E7EB] bg-white px-3 py-1 text-[12px] font-semibold text-[#DC2626] transition-colors hover:border-[#FECACA] hover:bg-[#FEF2F2]"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notification Detail Modal */}
      {viewingItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 font-['Roboto_Condensed',sans-serif] animate-in fade-in duration-150"
          onClick={() => setViewingItem(null)}
        >
          <div
            className="no-scrollbar w-full max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
              <div className="flex items-center gap-2.5">
                <h3 className="text-[16px] font-bold text-[#111827]">
                  {viewingItem.category}
                </h3>
                <span className="text-[#D1D5DB]">•</span>
                <span className="text-[12px] text-[#6B7280]">
                  {formatTimeAgo(viewingItem.timestamp)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setViewingItem(null)}
                aria-label="Close"
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-white text-[#374151] transition-all duration-150 hover:bg-[#DC2626] hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <h4 className="text-[14.5px] font-semibold text-[#111827]">
                {viewingItem.title}
              </h4>
              <p className="rounded-lg border border-[#E5E7EB] bg-white p-4 text-[13.5px] leading-relaxed text-[#4B5563]">
                {viewingItem.message}
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-4">
              <button
                type="button"
                onClick={() => handleDeleteItem(viewingItem.id)}
                className="cursor-pointer rounded-md border border-[#E5E7EB] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#DC2626] transition-colors hover:border-[#FECACA] hover:bg-[#FEF2F2]"
              >
                Delete
              </button>

              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="cursor-pointer rounded-lg border border-[#E5E7EB] bg-white px-4 py-1.5 text-[13px] font-semibold text-[#374151] transition-colors duration-150 hover:border-[#DC2626] hover:bg-[#DC2626] hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
