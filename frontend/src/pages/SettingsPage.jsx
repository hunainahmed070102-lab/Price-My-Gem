import React, { useState, useEffect } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { adminService } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function SettingsPage() {
  const toast = useToast();

  // Profile Information
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Admin');
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    // 1. First populate from localStorage
    const storedName =
      localStorage.getItem('adminName') ||
      JSON.parse(localStorage.getItem('user') || '{}').full_name ||
      'Aqeel Abidi';
    const storedEmail =
      localStorage.getItem('adminEmail') ||
      JSON.parse(localStorage.getItem('user') || '{}').email ||
      'maqeelabidi72@gmail.com';

    setFullName(storedName);
    setEmail(storedEmail);
    setRole('Admin');

    // 2. Fetch fresh profile from API
    try {
      setLoading(true);
      const res = await adminService.getProfile().catch(() => ({ success: false }));
      if (res && res.success && res.data) {
        if (res.data.full_name) setFullName(res.data.full_name);
        if (res.data.email) setEmail(res.data.email);
      }
    } catch (err) {
      console.warn('Profile fetch note:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (savingProfile) return;

    const cleanName = fullName.trim();
    if (!cleanName) {
      toast.warning('Please enter a full name');
      return;
    }

    setSavingProfile(true);
    try {
      const res = await adminService.updateProfile({
        full_name: cleanName,
        email: email.trim(),
      });

      if (res && res.success) {
        const updatedName = res.data?.full_name || cleanName;
        const updatedEmail = res.data?.email || email.trim();
        setFullName(updatedName);
        localStorage.setItem('adminName', updatedName);
        try {
          const userObj = JSON.parse(localStorage.getItem('user') || '{}');
          userObj.full_name = updatedName;
          localStorage.setItem('user', JSON.stringify(userObj));
        } catch (_) { }

        window.dispatchEvent(
          new CustomEvent('admin-profile-updated', {
            detail: { full_name: updatedName, email: updatedEmail },
          })
        );
        toast.success('Profile updated successfully');
      } else {
        toast.error(res?.message || 'Failed to update profile');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.warning('Please enter your current administrator password');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.warning('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.warning('New password and confirmation do not match');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await adminService.changePassword(currentPassword, newPassword);
      if (res && res.success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        toast.success('Password updated successfully');
      } else {
        toast.error(res?.message || 'Failed to update password');
      }
    } catch (error) {
      console.error('Change password error:', error);
      const errMsg = error.response?.data?.message || 'Current password incorrect';
      toast.error(errMsg);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 font-['Roboto_Condensed',sans-serif]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[24px] font-bold tracking-tight text-[#111827]">
          Account <span className="text-[#6B58D6]">Settings</span>
        </h1>
      </div>

      {/* Two-Column Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column: Profile Card */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-xs">
          <div className="mb-5 border-b border-[#E5E7EB] pb-3.5">
            <h2 className="text-[16px] font-bold text-[#111827]">
              Admin Profile
            </h2>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-[13px]">
            <div>
              <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter full name"
                className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-[13.5px] font-medium text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-colors focus:border-[#6B58D6]"
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  type="email"
                  value={email}
                  readOnly
                  disabled
                  className="w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] py-2.5 pl-10 pr-3.5 text-[13.5px] text-[#6B7280] cursor-not-allowed select-none font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">
                Role
              </label>
              <input
                type="text"
                value={role}
                readOnly
                disabled
                className="w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3.5 py-2.5 text-[13.5px] font-bold text-[#111827] cursor-not-allowed select-none"
              />
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={savingProfile || loading}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#6B58D6] px-5 py-2.5 text-[13px] font-semibold text-white shadow-xs transition-colors duration-150 hover:bg-[#5845C2] disabled:opacity-60"
              >
                {savingProfile && <Loader2 size={14} className="animate-spin" />}
                <span>{savingProfile ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Change Password Card */}
        <div>
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-xs">
            <div className="mb-5 border-b border-[#E5E7EB] pb-3.5">
              <h2 className="text-[16px] font-bold text-[#111827]">
                Change Password
              </h2>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 text-[13px]">
              <div>
                <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter existing password"
                    className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2.5 pr-10 text-[13.5px] text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-colors focus:border-[#6B58D6]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827]"
                  >
                    {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2.5 pr-10 text-[13.5px] text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-colors focus:border-[#6B58D6]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827]"
                  >
                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2.5 pr-10 text-[13.5px] text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-colors focus:border-[#6B58D6]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827]"
                  >
                    {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#6B58D6] px-5 py-2.5 text-[13px] font-semibold text-white shadow-xs transition-colors duration-150 hover:bg-[#5845C2] disabled:opacity-60"
                >
                  {savingPassword && <Loader2 size={14} className="animate-spin" />}
                  <span>{savingPassword ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
}
