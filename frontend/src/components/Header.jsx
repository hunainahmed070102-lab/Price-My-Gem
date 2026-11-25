import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';

export default function Header({ onMenuClick, unreadCount = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [adminName, setAdminName] = useState(() => {
    return (
      localStorage.getItem('adminName') ||
      JSON.parse(localStorage.getItem('user') || '{}').full_name ||
      'Aqeel Abidi'
    );
  });

  const [adminEmail, setAdminEmail] = useState(() => {
    return (
      localStorage.getItem('adminEmail') ||
      JSON.parse(localStorage.getItem('user') || '{}').email ||
      'maqeelabidi72@gmail.com'
    );
  });

  useEffect(() => {
    // Listen to admin-profile-updated events dispatched from SettingsPage
    const handleProfileUpdate = (e) => {
      if (e.detail?.full_name) {
        setAdminName(e.detail.full_name);
      }
      if (e.detail?.email) {
        setAdminEmail(e.detail.email);
      }
    };

    window.addEventListener('admin-profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('admin-profile-updated', handleProfileUpdate);
  }, []);

  // Determine subpage for "Dashboard / [Subpage]"
  const getSubPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Overview';
    if (path === '/users') return 'Users Management';
    if (path === '/reports') return 'Reports';
    if (path === '/gems' || path === '/prices') return 'Gems & Prices';
    if (path === '/notifications') return 'Notifications';
    if (path === '/settings') return 'Settings';
    return 'Overview';
  };

  const initials = adminName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AA';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E5E7EB] bg-white px-5 lg:px-8 font-['Roboto_Condensed',sans-serif]">
      
      {/* Left: Mobile hamburger & "Dashboard / [Page]" breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#4B5563] hover:bg-[#F3F4F6] md:hidden cursor-pointer"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2 text-[13.5px]">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="cursor-pointer font-medium text-[#6B7280] transition-colors hover:text-[#6B58D6]"
          >
            Dashboard
          </button>
          <span className="text-[#D1D5DB]">/</span>
          <span className="font-bold text-[#111827]">
            {getSubPageTitle()}
          </span>
        </div>
      </div>

      {/* Right: Notifications & Profile */}
      <div className="flex items-center gap-3 sm:gap-5">
        
        {/* Notifications Bell */}
        <button
          type="button"
          onClick={() => navigate('/notifications')}
          className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#4B5563] transition-colors hover:bg-[#F3F4F6] hover:text-[#6B58D6]"
          title="Notifications"
        >
          <Bell size={19} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#6B58D6] px-1 text-[10px] font-bold text-white shadow-xs">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Clean Profile Button */}
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="flex cursor-pointer items-center gap-2.5 transition-opacity hover:opacity-85"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6B58D6] text-[12px] font-bold text-white shadow-xs">
            {initials}
          </div>
          <div className="hidden text-left sm:block">
            <div className="text-[13px] font-bold text-[#111827] leading-tight">
              {adminName}
            </div>
            <div className="text-[11px] text-[#6B7280] leading-tight truncate max-w-[170px]">
              {adminEmail}
            </div>
          </div>
        </button>
      </div>
    </header>
  );
}
