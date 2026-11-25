import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/api';

export default function ProtectedRoute({ children }) {
  const isAuthenticated = authService.isAuthenticated();
  const isAdmin = authService.isAdmin();

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
