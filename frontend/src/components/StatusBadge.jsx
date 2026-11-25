import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertCircle, ShieldCheck } from 'lucide-react';

function capitalizeFirst(value, fallback = '') {
  const raw = String(value || fallback).trim();
  if (!raw) return fallback;
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export default function StatusBadge({ status, size = 'md', showIcon = true }) {
  const norm = String(status || '').toLowerCase().trim();
  const displayLabel = capitalizeFirst(status, 'Active');

  // Determine badge styling matching Price My Gem system
  let config = {
    bg: 'bg-[#F0FDF4]',
    text: 'text-[#15803D]',
    border: 'border-[#BBF7D0]',
    label: displayLabel,
    icon: CheckCircle2,
  };

  if (norm === 'pending' || norm === 'under review' || norm === 'synthetic' || norm === 'in review') {
    config = {
      bg: 'bg-[#FFFBEB]',
      text: 'text-[#B45309]',
      border: 'border-[#FDE68A]',
      label: displayLabel || 'Pending',
      icon: Clock,
    };
  } else if (norm === 'uncertain') {
    config = {
      bg: 'bg-[#F9FAFB]',
      text: 'text-[#4B5563]',
      border: 'border-[#E5E7EB]',
      label: 'Uncertain',
      icon: AlertCircle,
    };
  } else if (norm === 'rejected' || norm === 'blocked' || norm === 'fake' || norm === 'suspended') {
    config = {
      bg: 'bg-[#FEF2F2]',
      text: 'text-[#DC2626]',
      border: 'border-[#FECACA]',
      label: displayLabel || 'Rejected',
      icon: XCircle,
    };
  } else if (norm === 'verified' || norm === 'kyc verified' || norm === 'officer' || norm === 'admin') {
    config = {
      bg: 'bg-[#F5F3FF]',
      text: 'text-[#6B58D6]',
      border: 'border-[#E3DEFC]',
      label: displayLabel || 'Verified',
      icon: ShieldCheck,
    };
  } else if (norm === 'natural' || norm === 'real' || norm === 'active' || norm === 'resolved') {
    config = {
      bg: 'bg-[#F0FDF4]',
      text: 'text-[#15803D]',
      border: 'border-[#BBF7D0]',
      label: norm === 'real' ? 'Real' : norm === 'natural' ? 'Natural' : displayLabel || 'Active',
      icon: CheckCircle2,
    };
  }

  const Icon = config.icon;
  const isSm = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-wide ${config.bg} ${config.text} ${config.border} ${
        isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-[12px]'
      }`}
    >
      {showIcon && <Icon size={isSm ? 11 : 13} strokeWidth={2.4} />}
      <span>{config.label}</span>
    </span>
  );
}
