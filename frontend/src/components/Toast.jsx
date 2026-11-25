import React, { useEffect, useState } from 'react';
import { Check, AlertCircle, AlertTriangle, Info } from 'lucide-react';

/* Single White Centered Toast Item */
function ToastItem({ id, message, type = 'success', onRemove }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const enterTimer = requestAnimationFrame(() => {
      setVisible(true);
    });
    return () => cancelAnimationFrame(enterTimer);
  }, []);

  useEffect(() => {
    const autoTimer = setTimeout(() => {
      setLeaving(true);
      setTimeout(() => onRemove(id), 240);
    }, 3600);
    return () => clearTimeout(autoTimer);
  }, [id, onRemove]);

  const getIcon = () => {
    if (type === 'error') {
      return (
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <AlertCircle size={12} strokeWidth={2.5} style={{ color: '#FFFFFF' }} />
        </div>
      );
    }
    if (type === 'warning') {
      return (
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={12} strokeWidth={2.5} style={{ color: '#FFFFFF' }} />
        </div>
      );
    }
    if (type === 'info') {
      return (
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: '#6B58D6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Info size={12} strokeWidth={2.5} style={{ color: '#FFFFFF' }} />
        </div>
      );
    }
    return (
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          backgroundColor: '#6B58D6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Check size={12} strokeWidth={2.8} style={{ color: '#FFFFFF' }} />
      </div>
    );
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: 12,
        padding: '10px 18px',
        boxShadow: '0 8px 24px rgba(17, 24, 39, 0.08), 0 1px 4px rgba(17, 24, 39, 0.04)',
        width: 'fit-content',
        minWidth: 220,
        maxWidth: 'calc(100vw - 32px)',
        pointerEvents: 'auto',
        fontFamily: "'Roboto Condensed', -apple-system, BlinkMacSystemFont, sans-serif",
        opacity: visible && !leaving ? 1 : 0,
        transform: visible && !leaving ? 'translateY(0) scale(1)' : 'translateY(-12px) scale(0.97)',
        transition: 'all 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {getIcon()}
      <span
        style={{
          fontSize: 13.5,
          fontWeight: 500,
          color: '#111827',
          lineHeight: 1.4,
          textAlign: 'center',
        }}
      >
        {message}
      </span>
    </div>
  );
}

/* Fixed Top-Center Toast Stack */
export default function ToastContainer({ toasts, onRemove }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      style={{
        position: 'fixed',
        top: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        pointerEvents: 'none',
        width: '100%',
        maxWidth: 480,
        padding: '0 16px',
        boxSizing: 'border-box',
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} onRemove={onRemove} />
      ))}
    </div>
  );
}
