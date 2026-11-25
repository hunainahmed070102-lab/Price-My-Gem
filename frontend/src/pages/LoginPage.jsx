
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';

import { authService } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [mode, setMode] = useState('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot password flow state
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [resetLoading, setResetLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Design system
  const headingClass =
    'm-0 mb-3 text-[23px] font-semibold leading-[1.3] tracking-[-0.4px] text-[#25223A]';

  const descriptionClass =
    'm-0 mb-5 text-[14px] font-normal leading-[1.6] text-[#737383]';

  const labelClass =
    'mb-2 block text-[14px] font-medium text-[#45445A]';

  const inputClass =
    'box-border block h-[51px] w-full rounded-[12px] border border-[#E1E8F0] bg-white pl-11 pr-4 text-[14px] font-normal text-[#25223A] placeholder:text-[#A0A0AE] outline-none transition-colors focus:border-[#6B58D6] focus:bg-white disabled:opacity-60';

  const passwordInputClass =
    'box-border block h-[51px] w-full rounded-[12px] border border-[#E1E8F0] bg-white pl-11 pr-11 text-[14px] font-normal text-[#25223A] placeholder:text-[#A0A0AE] outline-none transition-colors focus:border-[#6B58D6] focus:bg-white disabled:opacity-60';

  const buttonClass =
    'box-border flex h-[51px] w-full items-center justify-center gap-2 rounded-full bg-[#6B58D6] text-[14px] font-semibold text-white transition-colors duration-150 hover:bg-[#5845C2] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer';

  const iconClass =
    'pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]';

  const eyeButtonClass =
    'absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] transition-colors hover:text-[#6B58D6] cursor-pointer disabled:opacity-50';

  // OTP resend countdown
  useEffect(() => {
    if (resendCooldown <= 0) return undefined;

    const timer = setTimeout(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Open forgot password
  const handleOpenForgotPassword = () => {
    setResetEmail(email.trim() || 'maqeelabidi72@gmail.com');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setResendCooldown(0);
    setMode('forgot_request');
  };

  // Return to login
  const handleBackToLogin = () => {
    setMode('login');
  };

  // STEP 1: LOGIN
  const handleLogin = async (event) => {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      toast.warning('Please enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login(trimmedEmail, password);

      if (response.success) {
        if (response.data?.role !== 'admin') {
          toast.error('Access denied. Administrator privileges required.');
          authService.logout();
          return;
        }

        toast.success('Logged in successfully.');
        navigate('/dashboard');
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Login failed. Please check your credentials.';

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: SEND OTP
  const handleRequestOtp = async (event) => {
    event.preventDefault();

    const trimmedEmail = resetEmail.trim();

    if (!trimmedEmail) {
      toast.warning('Please enter your admin email address.');
      return;
    }

    setResetLoading(true);

    try {
      const response = await authService.forgotPassword(trimmedEmail);

      if (response.success) {
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setResendCooldown(60);
        setMode('forgot_otp');

        toast.success(
          'A 6-digit verification code has been sent to your email.'
        );
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Unable to send OTP. Please check your email address.';

      toast.error(message);
    } finally {
      setResetLoading(false);
    }
  };

  // STEP 3: VERIFY OTP
  const handleVerifyOtp = (event) => {
    event.preventDefault();

    const cleanOtp = otp.replace(/\D/g, '');

    if (cleanOtp.length !== 6) {
      toast.warning('Please enter the complete 6-digit OTP.');
      return;
    }

    setOtp(cleanOtp);
    setMode('forgot_password');
  };

  // RESEND OTP
  const handleResendOtp = async () => {
    if (resetLoading || resendCooldown > 0) return;

    setResetLoading(true);

    try {
      const response = await authService.forgotPassword(
        resetEmail.trim()
      );

      if (response.success) {
        setOtp('');
        setResendCooldown(60);
        toast.success('A new verification code has been sent to your email.');
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Unable to resend OTP. Please try again.';

      toast.error(message);
    } finally {
      setResetLoading(false);
    }
  };

  // STEP 4: RESET PASSWORD
  const handleResetPassword = async (event) => {
    event.preventDefault();

    const cleanOtp = otp.replace(/\D/g, '');

    if (cleanOtp.length !== 6) {
      toast.warning('Your OTP must contain exactly 6 digits.');
      setMode('forgot_otp');
      return;
    }

    if (newPassword.length < 6) {
      toast.warning('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.warning('Passwords do not match.');
      return;
    }

    setResetLoading(true);

    try {
      const response = await authService.resetPassword(
        resetEmail.trim(),
        cleanOtp,
        newPassword
      );

      if (response.success) {
        setEmail(resetEmail.trim());
        setPassword('');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setMode('login');

        toast.success('Password updated successfully.');
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Password reset failed. Please check your OTP and try again.';

      toast.error(message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-white px-5 py-10 font-['Roboto_Condensed',sans-serif] selection:bg-[#6B58D6]/15">

      {/* CENTER LOGIN CARD */}
      <div className="box-border w-full max-w-[448px] rounded-[18px] border border-[#E1E8F0] bg-white px-6 py-9 shadow-[0_2px_8px_rgba(18,15,41,0.02)] sm:px-[34px] sm:py-[38px]">

        {/* MODE 1: LOGIN */}
        {mode === 'login' && (
          <div>
            <div>
              <h2 className={headingClass}>
                Welcome <span className="font-semibold text-[#6B58D6]">Back</span>
              </h2>

              <p className={descriptionClass}>
                Sign in to access your Price My Gem dashboard.
              </p>
            </div>

            <form onSubmit={handleLogin}>
              <div className="space-y-5">

                {/* Email */}
                <div>
                  <label htmlFor="login-email" className={labelClass}>
                    Email Address
                  </label>

                  <div className="relative">
                    <Mail size={19} className={iconClass} />

                    <input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      required
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="login-password"
                      className="text-[14px] font-medium text-[#45445A]"
                    >
                      Password
                    </label>

                    <button
                      type="button"
                      onClick={handleOpenForgotPassword}
                      className="cursor-pointer text-[13px] font-medium text-[#6B58D6] transition-colors hover:text-[#5543BE]"
                    >
                      Forgot Password
                    </button>
                  </div>

                  <div className="relative">
                    <Lock size={19} className={iconClass} />

                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="current-password"
                      required
                      disabled={loading}
                      className={passwordInputClass}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      disabled={loading}
                      className={eyeButtonClass}
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={19} />
                      ) : (
                        <Eye size={19} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`${buttonClass} mt-7`}
              >
                {loading ? (
                  <>
                    <RefreshCw size={17} className="animate-spin" />
                    SIGNING IN...
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </form>

            <p className="mb-0 mt-9 text-center text-[13px] text-[#737383]">
              Price My Gem Admin Portal
            </p>
          </div>
        )}

        {/* MODE 2: REQUEST OTP */}
        {mode === 'forgot_request' && (
          <div>
            <h2 className={headingClass}>
              Forgot <span className="text-[#6B58D6]">Password</span>
            </h2>

            <p className={descriptionClass}>
              Enter your registered admin email address to receive a 6-digit
              verification code.
            </p>

            <form onSubmit={handleRequestOtp}>
              <div className="mb-5">
                <label htmlFor="reset-email" className={labelClass}>
                  Admin Email Address
                </label>

                <div className="relative">
                  <Mail size={19} className={iconClass} />

                  <input
                    id="reset-email"
                    type="email"
                    placeholder="Enter your email address"
                    value={resetEmail}
                    onChange={(event) => setResetEmail(event.target.value)}
                    autoComplete="email"
                    required
                    autoFocus
                    disabled={resetLoading}
                    className={inputClass}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className={buttonClass}
              >
                {resetLoading ? (
                  <>
                    <RefreshCw size={17} className="animate-spin" />
                    SENDING OTP...
                  </>
                ) : (
                  'SEND OTP'
                )}
              </button>

              <button
                type="button"
                onClick={handleBackToLogin}
                className="mt-5 w-full cursor-pointer text-center text-[13px] font-medium text-[#6B58D6] hover:text-[#5543BE]"
              >
                Back to Login
              </button>
            </form>
          </div>
        )}

        {/* MODE 3: VERIFY OTP */}
        {mode === 'forgot_otp' && (
          <div>
            <h2 className={headingClass}>
              Verify <span className="text-[#6B58D6]">OTP</span>
            </h2>

            <p className={descriptionClass}>
              Enter the 6-digit verification code sent to your admin email.
            </p>

            <form onSubmit={handleVerifyOtp}>
              <div className="mb-5">
                <label htmlFor="reset-otp" className={labelClass}>
                  6-Digit OTP Code
                </label>

                <input
                  id="reset-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(event) => {
                    setOtp(
                      event.target.value.replace(/\D/g, '').slice(0, 6)
                    );
                  }}
                  required
                  autoFocus
                  disabled={resetLoading}
                  className="box-border block h-[51px] w-full rounded-[12px] border border-[#E1E8F0] bg-white px-4 text-center text-[20px] font-semibold tracking-[8px] text-[#25223A] placeholder:text-[14px] placeholder:tracking-normal placeholder:text-[#A0A0AE] outline-none transition-colors focus:border-[#6B58D6] disabled:opacity-60"
                />
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className={buttonClass}
              >
                VERIFY OTP
              </button>

              <div className="mt-5 text-center">
                {resendCooldown > 0 ? (
                  <p className="text-[13px] text-[#737383]">
                    Resend code in{' '}
                    <span className="font-semibold text-[#6B58D6]">
                      {resendCooldown}s
                    </span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resetLoading}
                    className="cursor-pointer text-[13px] font-medium text-[#6B58D6] hover:text-[#5543BE] disabled:opacity-50"
                  >
                    Didn't receive the code? Resend OTP
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setMode('forgot_request')}
                className="mt-4 w-full cursor-pointer text-center text-[13px] font-medium text-[#737383] hover:text-[#6B58D6]"
              >
                Change Email Address
              </button>
            </form>
          </div>
        )}

        {/* MODE 4: NEW PASSWORD */}
        {mode === 'forgot_password' && (
          <div>
            <h2 className={headingClass}>
              Create New <span className="text-[#6B58D6]">Password</span>
            </h2>

            <p className={descriptionClass}>
              Set a new password for your administrator account.
            </p>

            <form onSubmit={handleResetPassword}>
              <div className="space-y-5">

                {/* New password */}
                <div>
                  <label htmlFor="new-password" className={labelClass}>
                    New Password
                  </label>

                  <div className="relative">
                    <Lock size={19} className={iconClass} />

                    <input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      autoComplete="new-password"
                      minLength={6}
                      required
                      autoFocus
                      disabled={resetLoading}
                      className={passwordInputClass}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowNewPassword((value) => !value)
                      }
                      disabled={resetLoading}
                      className={eyeButtonClass}
                      aria-label={
                        showNewPassword ? 'Hide password' : 'Show password'
                      }
                    >
                      {showNewPassword ? (
                        <EyeOff size={19} />
                      ) : (
                        <Eye size={19} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label htmlFor="confirm-password" className={labelClass}>
                    Confirm New Password
                  </label>

                  <div className="relative">
                    <Lock size={19} className={iconClass} />

                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      autoComplete="new-password"
                      minLength={6}
                      required
                      disabled={resetLoading}
                      className={passwordInputClass}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((value) => !value)
                      }
                      disabled={resetLoading}
                      className={eyeButtonClass}
                      aria-label={
                        showConfirmPassword
                          ? 'Hide password'
                          : 'Show password'
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={19} />
                      ) : (
                        <Eye size={19} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className={`${buttonClass} mt-7`}
              >
                {resetLoading ? (
                  <>
                    <RefreshCw size={17} className="animate-spin" />
                    UPDATING PASSWORD...
                  </>
                ) : (
                  'UPDATE PASSWORD'
                )}
              </button>
            </form>
          </div>
        )}

      </div>
    </main>
  );
}
