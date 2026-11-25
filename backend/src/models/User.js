const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

const User = {
  // ── Find by email ────────────────────────────────────────────────────────────
  findByEmail: async (email) => {
    const rows = await query(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email.toLowerCase().trim()]
    );
    return rows[0] || null;
  },

  // ── Find by id ───────────────────────────────────────────────────────────────
  findById: async (id) => {
    const rows = await query(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  // ── Find by id (exclude password) ───────────────────────────────────────────
  findByIdSafe: async (id) => {
    const rows = await query(
      'SELECT id, full_name, email, status, createdAt, updatedAt, createdAt AS created_at, updatedAt AS updated_at FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  // ── Get all users (exclude password, include scan activity counts) ───────────
  getAll: async () => {
    return query(
      `SELECT u.id, u.full_name, u.email, u.status, u.createdAt, u.updatedAt,
              u.createdAt AS created_at, u.updatedAt AS updated_at,
              COUNT(r.id) AS report_count,
              MAX(r.createdAt) AS last_scan_at
       FROM users u
       LEFT JOIN reports r ON r.user_id = u.id
       GROUP BY u.id
       ORDER BY u.createdAt DESC`
    );
  },

  // ── Create user ──────────────────────────────────────────────────────────────
  create: async ({ full_name, email, password }) => {
    const hash = await bcrypt.hash(password, 10);
    const now = new Date();
    const result = await query(
      `INSERT INTO users (full_name, email, password, status, createdAt, updatedAt)
       VALUES (?, ?, ?, 'active', ?, ?)`,
      [full_name || null, email.toLowerCase().trim(), hash, now, now]
    );
    return { id: result.insertId, full_name: full_name || null, email, status: 'active', createdAt: now, updatedAt: now };
  },

  // ── Update status ────────────────────────────────────────────────────────────
  updateStatus: async (id, status) => {
    await query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
    return User.findByIdSafe(id);
  },

  // ── Update profile ───────────────────────────────────────────────────────────
  updateProfile: async (id, { full_name }) => {
    await query('UPDATE users SET full_name = ? WHERE id = ?', [full_name, id]);
    return User.findByIdSafe(id);
  },

  // ── Change password ──────────────────────────────────────────────────────────
  updatePassword: async (id, newPassword) => {
    const hash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password = ? WHERE id = ?', [hash, id]);
  },

  // ── Compare password ─────────────────────────────────────────────────────────
  comparePassword: async (plainPassword, hashedPassword) => {
    return bcrypt.compare(plainPassword, hashedPassword);
  },

  // ── Count total ──────────────────────────────────────────────────────────────
  count: async () => {
    const rows = await query('SELECT COUNT(*) AS total FROM users');
    return rows[0].total;
  },

  // ── Set Reset OTP ────────────────────────────────────────────────────────────
  setResetOtp: async (email, otp, expiresAt) => {
    await query(
      'UPDATE users SET reset_otp = ?, reset_otp_expires = ? WHERE email = ?',
      [otp, expiresAt, email.toLowerCase().trim()]
    );
  },

  // ── Verify Reset OTP ─────────────────────────────────────────────────────────
  verifyResetOtp: async (email, otp) => {
    const rows = await query(
      'SELECT id, email, full_name, reset_otp_expires FROM users WHERE email = ? AND reset_otp = ? LIMIT 1',
      [email.toLowerCase().trim(), String(otp).trim()]
    );
    if (!rows.length) return { valid: false, message: 'Invalid 6-digit verification code' };
    const user = rows[0];
    if (new Date(user.reset_otp_expires) < new Date()) {
      return { valid: false, message: 'Verification code has expired. Please request a new code.' };
    }
    return { valid: true, user };
  },

  // ── Reset Password with OTP ──────────────────────────────────────────────────
  resetPasswordWithOtp: async (email, otp, newPassword) => {
    const verification = await User.verifyResetOtp(email, otp);
    if (!verification.valid) return verification;
    const hash = await bcrypt.hash(newPassword, 10);
    await query(
      'UPDATE users SET password = ?, reset_otp = NULL, reset_otp_expires = NULL WHERE id = ?',
      [hash, verification.user.id]
    );
    return { valid: true, message: 'Password reset successfully' };
  },

  // ── Set Registration OTP ─────────────────────────────────────────────────────
  setRegistrationOtp: async (email, otp, fullName, expiresAt) => {
    await query(
      `REPLACE INTO pending_registrations (email, otp, full_name, expires_at)
       VALUES (?, ?, ?, ?)`,
      [email.toLowerCase().trim(), String(otp).trim(), fullName || null, expiresAt]
    );
  },

  // ── Verify Registration OTP ──────────────────────────────────────────────────
  verifyRegistrationOtp: async (email, otp) => {
    const rows = await query(
      'SELECT email, otp, full_name, expires_at FROM pending_registrations WHERE email = ? AND otp = ? LIMIT 1',
      [email.toLowerCase().trim(), String(otp).trim()]
    );
    if (!rows.length) return { valid: false, message: 'Invalid 6-digit registration code' };
    const record = rows[0];
    if (new Date(record.expires_at) < new Date()) {
      return { valid: false, message: 'Registration code has expired. Please request a new code.' };
    }
    return { valid: true, record };
  },

  // ── Clear Registration OTP ───────────────────────────────────────────────────
  clearRegistrationOtp: async (email) => {
    await query('DELETE FROM pending_registrations WHERE email = ?', [email.toLowerCase().trim()]);
  },

  // ── Delete user permanently (reports cascade via FK) ─────────────────────────
  deleteById: async (id) => {
    const result = await query('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows;
  }
};

module.exports = User;

