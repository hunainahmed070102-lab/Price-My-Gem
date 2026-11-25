import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { adminService } from '../services/api';

class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unexpected render error' };
  }

  componentDidCatch(error, info) {
    console.error('Dashboard section render error:', error, info);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false, message: '' });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-[#EDE9FE] bg-white p-8 text-center">
          <h2 className="text-[18px] text-[#1E1742]">Unable to render this section</h2>
          <p className="mt-1 text-[13px] text-[#6B7280]">{this.state.message}</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="mt-4 cursor-pointer rounded-lg bg-[#6B58D6] px-4 py-2 text-[13px] text-white transition-colors duration-150 hover:bg-[#5845C2]"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;

    const syncUnreadCount = async () => {
      try {
        const res = await adminService.getNotifications();
        if (!active) return;
        if (typeof res?.unreadCount === 'number') {
          setUnreadCount(res.unreadCount);
          return;
        }
        const list = Array.isArray(res?.data) ? res.data : [];
        setUnreadCount(list.filter((n) => !n.read).length);
      } catch (_) {
        if (active) setUnreadCount(0);
      }
    };

    const handleNotifUpdate = (event) => {
      if (typeof event?.detail?.unreadCount === 'number') {
        setUnreadCount(event.detail.unreadCount);
      } else {
        syncUnreadCount();
      }
    };

    syncUnreadCount();
    window.addEventListener('pmg-notifs-updated', handleNotifUpdate);
    return () => {
      active = false;
      window.removeEventListener('pmg-notifs-updated', handleNotifUpdate);
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-white font-['Roboto_Condensed',sans-serif] text-[#111827] antialiased">
      {/* Desktop Fixed Left Sidebar */}
      <div className="hidden md:block">
        <Sidebar unreadCount={unreadCount} />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <Sidebar
              onClose={() => setMobileMenuOpen(false)}
              unreadCount={unreadCount}
            />
          </div>
        </div>
      )}

      {/* Main Viewport Content Area */}
      <div className="flex flex-1 flex-col min-w-0 md:pl-[264px]">
        <Header
          onMenuClick={() => setMobileMenuOpen(true)}
          unreadCount={unreadCount}
        />

        <main className="flex-1 p-5 md:p-7 lg:p-8">
          <RouteErrorBoundary>{children}</RouteErrorBoundary>
        </main>
      </div>
    </div>
  );
}
