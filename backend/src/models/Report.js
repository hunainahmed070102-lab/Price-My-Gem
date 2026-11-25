const { query } = require('../config/database');

const Report = {
  // ── Create a new report ──────────────────────────────────────────────────────
  create: async ({ user_id, image_url, gemstone_type, confidence, authenticity, price_range }) => {
    const result = await query(
      `INSERT INTO reports (user_id, image_url, gemstone_type, confidence, authenticity, price_range, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [user_id, image_url, gemstone_type, confidence, authenticity, price_range || null]
    );
    const rows = await query('SELECT * FROM reports WHERE id = ? LIMIT 1', [result.insertId]);
    return rows[0];
  },

  // ── Find by id ───────────────────────────────────────────────────────────────
  findById: async (id) => {
    const rows = await query(
      `SELECT
         r.id, r.user_id, r.image_url, r.gemstone_type, r.confidence,
         r.authenticity, r.price_range, r.review_status, r.admin_notes,
         r.createdAt, r.updatedAt,
         r.createdAt AS created_at, r.updatedAt AS updated_at,
         u.email AS user_email, u.full_name AS user_name
       FROM reports r
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  // ── Find by user id ──────────────────────────────────────────────────────────
  findByUserId: async (userId) => {
    return query(
      'SELECT id, user_id, image_url, gemstone_type, confidence, authenticity, price_range, createdAt, updatedAt, createdAt AS created_at, updatedAt AS updated_at FROM reports WHERE user_id = ? ORDER BY createdAt DESC',
      [userId]
    );
  },

  // ── Delete all reports for a user ────────────────────────────────────────────
  deleteByUserId: async (userId) => {
    const result = await query('DELETE FROM reports WHERE user_id = ?', [userId]);
    return result.affectedRows;
  },

  // ── Delete single report owned by user ───────────────────────────────────────
  deleteByIdForUser: async (id, userId) => {
    const result = await query('DELETE FROM reports WHERE id = ? AND user_id = ?', [id, userId]);
    return result.affectedRows;
  },

  // ── Get all reports joined with user info ────────────────────────────────────
  getAll: async () => {
    return query(`
      SELECT
        r.id,
        r.user_id,
        r.image_url,
        r.gemstone_type,
        r.confidence,
        r.authenticity,
        r.price_range,
        r.review_status,
        r.admin_notes,
        r.createdAt,
        r.updatedAt,
        r.createdAt AS created_at,
        r.updatedAt AS updated_at,
        u.email   AS user_email,
        u.full_name AS user_name
      FROM reports r
      LEFT JOIN users u ON u.id = r.user_id
      ORDER BY r.createdAt DESC
    `);
  },

  // ── Update report review status / authenticity / admin notes ────────────────
  updateById: async (id, fields = {}) => {
    const allowed = ['review_status', 'admin_notes', 'authenticity'];
    const assignments = [];
    const values = [];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        assignments.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }

    if (assignments.length === 0) {
      return Report.findById(id);
    }

    assignments.push('updatedAt = NOW()');
    values.push(id);

    const res = await query(
      `UPDATE reports SET ${assignments.join(', ')} WHERE id = ?`,
      values
    );
    if (res.affectedRows === 0) return null;
    return Report.findById(id);
  },

  // ── Delete single report ────────────────────────────────────────────────────
  deleteById: async (id) => {
    const result = await query('DELETE FROM reports WHERE id = ?', [id]);
    return result.affectedRows;
  },

  // ── Count total ──────────────────────────────────────────────────────────────
  count: async () => {
    const rows = await query('SELECT COUNT(*) AS total FROM reports');
    return rows[0].total;
  },

  // ── Gemstone distribution ────────────────────────────────────────────────────
  gemstoneDistribution: async () => {
    return query(`
      SELECT gemstone_type, COUNT(*) AS count
      FROM reports
      GROUP BY gemstone_type
      ORDER BY count DESC
    `);
  },

  // ── Authenticity breakdown ──────────────────────────────────────────────────
  authenticityBreakdown: async () => {
    return query(`
      SELECT authenticity, COUNT(*) AS count
      FROM reports
      GROUP BY authenticity
    `);
  },

  // ── Daily counts for last N days ────────────────────────────────────────────
  dailyActivity: async (days = 30) => {
    return query(
      `SELECT
         DATE(createdAt) AS day,
         COUNT(*) AS scans,
         SUM(CASE WHEN authenticity = 'real' THEN 1 ELSE 0 END) AS authentic_count,
         SUM(CASE WHEN authenticity = 'synthetic' THEN 1 ELSE 0 END) AS synthetic_count,
         SUM(CASE WHEN authenticity = 'uncertain' THEN 1 ELSE 0 END) AS uncertain_count
       FROM reports
       WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(createdAt)
       ORDER BY day ASC`,
      [Math.max(1, Number(days) - 1)]
    );
  }
};

module.exports = Report;
