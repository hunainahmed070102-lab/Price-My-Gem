const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

const Admin = {
  // ── Find by email ────────────────────────────────────────────────────────────
  findByEmail: async (email) => {
    const rows = await query(
      'SELECT * FROM admins WHERE email = ? LIMIT 1',
      [email.toLowerCase().trim()]
    );
    return rows[0] || null;
  },

  // ── Find by id ───────────────────────────────────────────────────────────────
  findById: async (id) => {
    const rows = await query(
      'SELECT * FROM admins WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  // ── Find by id (exclude password) ───────────────────────────────────────────
  findByIdSafe: async (id) => {
    const rows = await query(
      'SELECT id, full_name, email, profile_picture, createdAt, updatedAt, createdAt AS created_at, updatedAt AS updated_at FROM admins WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  // ── Compare password ─────────────────────────────────────────────────────────
  comparePassword: async (plainPassword, hashedPassword) => {
    return bcrypt.compare(plainPassword, hashedPassword);
  },

  // ── Update profile ───────────────────────────────────────────────────────────
  updateProfile: async (id, { full_name, email }) => {
    if (email) {
      await query(
        'UPDATE admins SET full_name = ?, email = ? WHERE id = ?',
        [full_name, email.toLowerCase().trim(), id]
      );
    } else {
      await query(
        'UPDATE admins SET full_name = ? WHERE id = ?',
        [full_name, id]
      );
    }
    return Admin.findByIdSafe(id);
  },

  // ── Update password ──────────────────────────────────────────────────────────
  updatePassword: async (id, newPassword) => {
    const hash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE admins SET password = ? WHERE id = ?', [hash, id]);
  },

  // ── Update profile picture ───────────────────────────────────────────────────
  updateProfilePicture: async (id, picturePath) => {
    await query('UPDATE admins SET profile_picture = ? WHERE id = ?', [picturePath, id]);
    return Admin.findByIdSafe(id);
  },

  // ── Check if email is taken by another admin ─────────────────────────────────
  emailExistsForOther: async (email, excludeId) => {
    const rows = await query(
      'SELECT id FROM admins WHERE email = ? AND id != ? LIMIT 1',
      [email.toLowerCase().trim(), excludeId]
    );
    return rows.length > 0;
  },

  // ── Set Reset OTP ────────────────────────────────────────────────────────────
  setResetOtp: async (email, otp, expiresAt) => {
    await query(
      'UPDATE admins SET reset_otp = ?, reset_otp_expires = ? WHERE email = ?',
      [otp, expiresAt, email.toLowerCase().trim()]
    );
  },

  // ── Verify Reset OTP ─────────────────────────────────────────────────────────
  verifyResetOtp: async (email, otp) => {
    const rows = await query(
      'SELECT id, email, full_name, reset_otp_expires FROM admins WHERE email = ? AND reset_otp = ? LIMIT 1',
      [email.toLowerCase().trim(), String(otp).trim()]
    );
    if (!rows.length) return { valid: false, message: 'Invalid 6-digit OTP code' };
    const admin = rows[0];
    if (new Date(admin.reset_otp_expires) < new Date()) {
      return { valid: false, message: 'Verification code has expired. Please request a new code.' };
    }
    return { valid: true, admin };
  },

  // ── Reset Password with OTP ──────────────────────────────────────────────────
  resetPasswordWithOtp: async (email, otp, newPassword) => {
    const verification = await Admin.verifyResetOtp(email, otp);
    if (!verification.valid) return verification;
    const hash = await bcrypt.hash(newPassword, 10);
    await query(
      'UPDATE admins SET password = ?, reset_otp = NULL, reset_otp_expires = NULL WHERE id = ?',
      [hash, verification.admin.id]
    );
    return { valid: true, message: 'Password reset successful' };
  }
};

module.exports = Admin;
