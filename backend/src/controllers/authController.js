const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User  = require('../models/User');
const Admin = require('../models/Admin');
const Report = require('../models/Report');
const { sendAdminResetOtpEmail, sendUserOtpEmail } = require('../utils/emailService');

// ─── Generate JWT ─────────────────────────────────────────────────────────────
const generateToken = (userId, userType = 'user') => {
  return jwt.sign(
    { userId, userType },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// ─── Send Register OTP (mobile app users) ──────────────────────────────────
exports.sendRegisterOtp = async (req, res, next) => {
  try {
    const { email, full_name } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Valid email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await User.findByEmail(normalizedEmail);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists'
      });
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in pending_registrations table
    await User.setRegistrationOtp(normalizedEmail, otp, full_name, expiresAt);

    // Send email via Gmail SMTP
    const emailResult = await sendUserOtpEmail({
      email: normalizedEmail,
      otp,
      purpose: 'signup',
      fullName: full_name || 'Valued User'
    });

    res.json({
      success: true,
      message: 'A 6-digit verification code has been sent to your email.',
      data: {
        email: normalizedEmail,
        expiryMinutes: 10,
        deliveredVia: emailResult.deliveredVia
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── Register (mobile app users only) ────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { full_name, email, password, otp } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findByEmail(normalizedEmail);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // If OTP provided, verify it
    if (otp) {
      const otpVerify = await User.verifyRegistrationOtp(normalizedEmail, otp);
      if (!otpVerify.valid) {
        return res.status(400).json({
          success: false,
          message: otpVerify.message || 'Invalid or expired verification code'
        });
      }
      await User.clearRegistrationOtp(normalizedEmail);
    }

    const user = await User.create({ full_name: full_name || null, email: normalizedEmail, password });
    const token = generateToken(user.id, 'user');

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        userId:    user.id,
        full_name: user.full_name,
        email:     user.email,
        role:      'user',
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── Login (admin collection first, then users) ───────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check admins table first
    let record   = await Admin.findByEmail(email);
    let userType = 'admin';

    // Fall back to users table
    if (!record) {
      record   = await User.findByEmail(email);
      userType = 'user';
    }

    if (!record) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Block check (users only)
    if (userType === 'user' && record.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked by the administrator. Please contact support.',
        blocked: true,
        contactEmail:    'pricemygem@gmail.com',
        contactWhatsApp: '+923112345678'
      });
    }

    const isPasswordValid = await (
      userType === 'admin'
        ? Admin.comparePassword(password, record.password)
        : User.comparePassword(password, record.password)
    );

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(record.id, userType);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        userId:    record.id,
        full_name: record.full_name,
        email:     record.email,
        role:      userType === 'admin' ? 'admin' : 'user',
        userType,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get current profile ──────────────────────────────────────────────────────
exports.getProfile = async (req, res, next) => {
  try {
    let profile;
    if (req.user.userType === 'admin') {
      profile = await Admin.findByIdSafe(req.user.id);
    } else {
      profile = await User.findByIdSafe(req.user.id);
    }

    if (!profile) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        id:        profile.id,
        full_name: profile.full_name,
        email:     profile.email,
        role:      req.user.userType === 'admin' ? 'admin' : 'user',
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── Update profile (full_name only via auth route) ───────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const { full_name } = req.body;

    let updated;
    if (req.user.userType === 'admin') {
      updated = await Admin.updateProfile(req.user.id, { full_name });
    } else {
      updated = await User.updateProfile(req.user.id, { full_name });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id:        updated.id,
        full_name: updated.full_name,
        email:     updated.email,
        role:      req.user.userType === 'admin' ? 'admin' : 'user'
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── Change password ──────────────────────────────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    let record;
    if (req.user.userType === 'admin') {
      record = await Admin.findById(req.user.id);
      const valid = await Admin.comparePassword(currentPassword, record.password);
      if (!valid) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }
      await Admin.updatePassword(req.user.id, newPassword);
    } else {
      record = await User.findById(req.user.id);
      const valid = await User.comparePassword(currentPassword, record.password);
      if (!valid) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }
      await User.updatePassword(req.user.id, newPassword);
    }

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

// ─── Forgot Password (Admin & Mobile User 6-digit OTP request) ──────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0]?.msg || 'Valid email is required',
        errors: errors.array()
      });
    }

    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Check admin first, then regular mobile user
    let userType = 'admin';
    let account = await Admin.findByEmail(normalizedEmail);

    if (!account) {
      account = await User.findByEmail(normalizedEmail);
      userType = 'user';
    }

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'No registered account found with this email address.'
      });
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let emailResult;
    if (userType === 'admin') {
      await Admin.setResetOtp(normalizedEmail, otp, expiresAt);
      emailResult = await sendAdminResetOtpEmail(normalizedEmail, otp, account.full_name);
    } else {
      await User.setResetOtp(normalizedEmail, otp, expiresAt);
      emailResult = await sendUserOtpEmail({
        email: normalizedEmail,
        otp,
        purpose: 'reset',
        fullName: account.full_name || 'Valued User'
      });
    }

    res.json({
      success: true,
      message: emailResult.deliveredVia === 'smtp'
        ? 'A 6-digit verification code has been sent to your email.'
        : 'A 6-digit verification code has been generated.',
      data: {
        email: normalizedEmail,
        userType,
        expiryMinutes: 10,
        deliveredVia: emailResult.deliveredVia
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── Verify OTP ───────────────────────────────────────────────────────────────
exports.verifyOtp = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0]?.msg || 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, otp } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Try Admin first
    let result = await Admin.verifyResetOtp(normalizedEmail, otp);
    if (!result.valid) {
      // Try User
      result = await User.verifyResetOtp(normalizedEmail, otp);
    }

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message || 'Invalid or expired OTP code.'
      });
    }

    res.json({
      success: true,
      message: 'OTP code verified successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// ─── Reset Password with OTP ──────────────────────────────────────────────────
exports.resetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0]?.msg || 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, otp, newPassword } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    // Try Admin first
    let result = await Admin.resetPasswordWithOtp(normalizedEmail, otp, newPassword);
    if (!result.valid) {
      // Try User
      result = await User.resetPasswordWithOtp(normalizedEmail, otp, newPassword);
    }

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message || 'Failed to reset password. Please request a new code.'
      });
    }

    res.json({
      success: true,
      message: 'Your password has been reset successfully. You can now log in.'
    });
  } catch (error) {
    next(error);
  }
};

// ─── Delete authenticated user's own account permanently ────────────────────
exports.deleteAccount = async (req, res, next) => {
  try {
    if (req.user.userType === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Administrator accounts cannot be deleted from the mobile app.'
      });
    }

    const userRecord = await User.findByIdSafe(req.user.id);
    if (!userRecord) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.'
      });
    }

    // Collect only this user's uploaded report images before cascading row deletion
    const userReports = await Report.findByUserId(userRecord.id);
    const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_PATH || './uploads');

    const deletedRows = await User.deleteById(userRecord.id);
    if (!deletedRows) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.'
      });
    }

    // Remove pending registration OTP entries if any
    await User.clearRegistrationOtp(userRecord.email);

    // Best-effort cleanup of this user's uploaded scan images on disk
    for (const report of userReports) {
      if (typeof report.image_url === 'string' && report.image_url.startsWith('/uploads/')) {
        const filename = path.basename(report.image_url);
        if (filename && !filename.includes('..')) {
          const filePath = path.join(uploadDir, filename);
          if (fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath);
            } catch (_) {}
          }
        }
      }
    }

    res.json({
      success: true,
      message: 'Your account has been permanently deleted.'
    });
  } catch (error) {
    next(error);
  }
};

