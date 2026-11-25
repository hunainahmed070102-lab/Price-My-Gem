import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import ToastContainer from '../components/Toast';

const ToastContext = createContext(null);

let _id = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'success') => {
    if (!message) return;

    setToasts((prev) => {
      // Prevent duplicate notification if the exact same message and type is already visible
      const exists = prev.some((t) => t.message === message && t.type === type);
      if (exists) {
        return prev;
      }
      const id = ++_id;
      // Cap at 4 visible toasts at a time
      const next = [...prev, { id, message, type }];
      if (next.length > 4) {
        return next.slice(-4);
      }
      return next;
    });
  }, []);

  // Expose both callable function and convenience helpers:
  // toast('Hello')
  // toast.success('Saved!')
  // toast.error('Something went wrong')
  // toast.warning('Please review this')
  // toast.info('Note this')
  const toastApi = useMemo(() => {
    const fn = (message, type = 'success') => addToast(message, type);
    fn.success = (msg) => addToast(msg, 'success');
    fn.error = (msg) => addToast(msg, 'error');
    fn.warning = (msg) => addToast(msg, 'warning');
    fn.info = (msg) => addToast(msg, 'info');
    return fn;
  }, [addToast]);

  return (
    <ToastContext.Provider value={toastApi}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    const noop = () => {};
    noop.success = noop;
    noop.error = noop;
    noop.warning = noop;
    noop.info = noop;
    return noop;
  }
  return ctx;
}
