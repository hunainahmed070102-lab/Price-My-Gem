import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Gem,
  Bell,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { authService } from '../services/api';
import { useToast } from '../context/ToastContext';
import ConfirmModal from './ConfirmModal';

export default function Sidebar({ onClose, unreadCount = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const toast = useToast();

  const handleLogout = () => {
    try {
      setShowLogoutConfirm(false);
      authService.logout();
    } catch (_) {}
    localStorage.removeItem('adminToken');
    localStorage.removeItem('token');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminName');
    localStorage.removeItem('adminRole');
    localStorage.removeItem('user');
    toast.success('Signed out successfully.');
    navigate('/login');
  };

  const mainNavItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
    },
    {
      id: 'users',
      label: 'Users Management',
      icon: Users,
      path: '/users',
    },
    {
      id: 'reports',
      label: 'Reports & Issues',
      icon: FileText,
      path: '/reports',
    },
    {
      id: 'gems',
      label: 'Gems & Prices',
      icon: Gem,
      path: '/gems',
      aliases: ['/prices'],
    },
  ];

  const systemNavItems = [
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      path: '/notifications',
      badge: unreadCount > 0 ? unreadCount : null,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/settings',
    },
  ];

  const handleNavClick = (path) => {
    navigate(path);
    onClose?.();
  };

  const renderNavList = (items) => (
    <nav className="space-y-1.5">
      {items.map((item) => {
        const IconComponent = item.icon;
        const isActive =
          location.pathname === item.path ||
          (item.aliases && item.aliases.includes(location.pathname));

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleNavClick(item.path)}
            className={`group flex w-full cursor-pointer items-center justify-between rounded-xl px-4 py-2.5 text-[14px] transition-all duration-150 ${
              isActive
                ? 'bg-[#6B58D6] text-white shadow-xs'
                : 'text-[#4B5563] hover:bg-[#F9FAFB] hover:text-[#6B58D6]'
            }`}
          >
            <div className="flex items-center gap-3">
              <IconComponent
                size={18}
                strokeWidth={isActive ? 2.1 : 1.8}
                className={isActive ? 'text-white' : 'text-[#6B7280] group-hover:text-[#6B58D6]'}
              />
              <span>{item.label}</span>
            </div>

            {item.badge ? (
              <span
                className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10.5px] ${
                  isActive
                    ? 'bg-white text-[#6B58D6]'
                    : 'bg-[#F3F4F6] text-[#6B58D6]'
                }`}
              >
                {item.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      <aside className="no-scrollbar fixed top-0 left-0 bottom-0 z-40 flex h-screen w-64 md:w-[264px] flex-col justify-between border-r border-[#E5E7EB] bg-white font-['Roboto_Condensed',sans-serif] text-[#111827] overflow-y-auto overflow-x-hidden">
        {/* Top: Brand Header & Navigation Sections */}
        <div>
          <div className="flex h-16 items-center justify-between border-b border-[#E5E7EB] px-5">
            <div
              onClick={() => handleNavClick('/dashboard')}
              className="flex cursor-pointer items-center gap-3 transition-opacity hover:opacity-90"
            >
              <img
                src="/logo.png?v=3"
                alt="Price My Gem"
                className="h-8 w-8 shrink-0 object-contain"
              />
              <div className="text-[16px] tracking-tight text-[#111827] leading-tight">
                Price My Gem
              </div>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-white text-[#374151] transition-all duration-150 hover:bg-[#DC2626] hover:text-white md:hidden"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Navigation Sections */}
          <div className="px-3.5 py-5 space-y-4">
            {renderNavList(mainNavItems)}
            <div className="pt-2">
              {renderNavList(systemNavItems)}
            </div>
          </div>
        </div>

        {/* Bottom: Sign Out Button (left-aligned, borderless, solid red hover) */}
        <div className="px-3.5 pb-4 pt-2">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="group flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 text-[14px] text-[#4B5563] transition-colors duration-150 hover:bg-[#DC2626] hover:text-white active:bg-[#B91C1C] active:text-white outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40"
          >
            <LogOut
              size={18}
              strokeWidth={1.8}
              className="text-[#6B7280] transition-colors duration-150 group-hover:text-white group-active:text-white"
            />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Sign Out"
        message="Are you sure you want to sign out of your account?"
        confirmText="Sign Out"
        confirmType="danger"
        onConfirm={handleLogout}
        onClose={() => setShowLogoutConfirm(false)}
      />
    </>
  );
}
