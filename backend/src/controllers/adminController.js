const fs     = require('fs');
const path   = require('path');
const User   = require('../models/User');
const Report = require('../models/Report');
const Price  = require('../models/Price');
const Admin  = require('../models/Admin');
const { query } = require('../config/database');

const buildDailySeries = (rows, days) => {
  const map = new Map();
  for (const row of rows) {
    const d = new Date(row.day);
    const key = d.toISOString().slice(0, 10);
    map.set(key, {
      scans: Number(row.scans || 0),
      authentic: Number(row.authentic_count || 0),
    });
  }

  const series = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - i);
    const key = date.toISOString().slice(0, 10);
    const bucket = map.get(key) || { scans: 0, authentic: 0 };
    const label = days <= 7
      ? date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })
      : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

    series.push({
      date: key,
      name: label,
      scans: bucket.scans,
      authentic: bucket.authentic,
    });
  }
  return series;
};

// ─── Get all users ────────────────────────────────────────────────────────────
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.getAll();
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    next(error);
  }
};

// ─── Get all reports (with user info) ────────────────────────────────────────
exports.getAllReports = async (req, res, next) => {
  try {
    const reports = await Report.getAll();
    res.json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    console.error('Get reports error:', error);
    next(error);
  }
};

// ─── Statistics ───────────────────────────────────────────────────────────────
exports.getStatistics = async (req, res, next) => {
  try {
    const [
      users,
      totalReports,
      totalPrices,
      gemstoneDistribution,
      authRows,
      daily30Rows,
    ] = await Promise.all([
      User.getAll(),
      Report.count(),
      Price.count(),
      Report.gemstoneDistribution(),
      Report.authenticityBreakdown(),
      Report.dailyActivity(30),
    ]);

    const totalUsers = users.length;
    const activeUsers = users.filter((u) => (u.status || 'active') === 'active').length;
    const blockedUsers = users.filter((u) => u.status === 'blocked').length;

    const authenticityBreakdown = { real: 0, synthetic: 0, uncertain: 0 };
    for (const row of authRows) {
      if (row.authenticity in authenticityBreakdown) {
        authenticityBreakdown[row.authenticity] = Number(row.count || 0);
      }
    }

    const dailyActivity30d = buildDailySeries(daily30Rows, 30);
    const dailyActivity7d = dailyActivity30d.slice(-7);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        blockedUsers,
        totalReports,
        totalPrices,
        authenticityBreakdown,
        dailyActivity7d,
        dailyActivity30d,
        gemstoneDistribution: gemstoneDistribution.map((row) => ({
          gemstone_type: row.gemstone_type,
          count: Number(row.count),
        })),
      },
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    next(error);
  }
};

// ─── Get all prices ───────────────────────────────────────────────────────────
exports.getAllPrices = async (req, res, next) => {
  try {
    const prices = await Price.getAll();
    res.json({ success: true, count: prices.length, data: prices });
  } catch (error) {
    next(error);
  }
};

// ─── Create new gemstone price entry ─────────────────────────────────────────
exports.createPrice = async (req, res, next) => {
  try {
    const {
      gemstone_type,
      price_per_carat,
      pricePerCarat,
      currency,
      category,
      mineral_family,
      mohs_hardness,
      primary_origins,
      characteristics,
      description,
      info_source_name,
      info_source_url,
      price_source_name,
      price_source_url,
    } = req.body;

    const cleanName = String(gemstone_type || '').trim();
    const numericPrice = parseFloat(price_per_carat ?? pricePerCarat);

    if (!cleanName) {
      return res.status(400).json({ success: false, message: 'Gemstone name is required' });
    }
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({ success: false, message: 'A valid positive price per carat is required' });
    }

    const existing = await Price.findByType(cleanName);
    if (existing) {
      return res.status(400).json({ success: false, message: `${cleanName} already exists in the catalog` });
    }

    const image_url = req.file ? `/uploads/${req.file.filename}` : (req.body.image_url || null);

    const created = await Price.create({
      gemstone_type: cleanName,
      price_per_carat: numericPrice,
      currency: String(currency || 'PKR').trim().toUpperCase(),
      category: String(category || 'Precious Gem').trim(),
      mineral_family: mineral_family ? String(mineral_family).trim() : null,
      mohs_hardness: mohs_hardness ? String(mohs_hardness).trim() : null,
      primary_origins: primary_origins ? String(primary_origins).trim() : null,
      characteristics: characteristics ? String(characteristics).trim() : null,
      description: description ? String(description).trim() : null,
      info_source_name: info_source_name ? String(info_source_name).trim() : null,
      info_source_url: info_source_url ? String(info_source_url).trim() : null,
      price_source_name: price_source_name ? String(price_source_name).trim() : null,
      price_source_url: price_source_url ? String(price_source_url).trim() : null,
      image_url,
    });

    res.status(201).json({
      success: true,
      message: 'Gemstone added successfully',
      data: created,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Update price per carat & gemstone details ───────────────────────────────
exports.updatePrice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await Price.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Gemstone entry not found' });
    }

    const {
      gemstone_type,
      price_per_carat,
      pricePerCarat,
      minPrice,
      maxPrice,
      currency,
      category,
      mineral_family,
      mohs_hardness,
      primary_origins,
      characteristics,
      description,
      info_source_name,
      info_source_url,
      price_source_name,
      price_source_url,
    } = req.body;

    const rawPrice = price_per_carat ?? pricePerCarat ?? minPrice ?? maxPrice;
    const fields = {};

    if (rawPrice !== undefined && rawPrice !== '') {
      const val = parseFloat(rawPrice);
      if (!Number.isFinite(val) || val <= 0) {
        return res.status(400).json({
          success: false,
          message: 'A valid positive price per carat is required',
        });
      }
      fields.price_per_carat = val;
    }

    if (gemstone_type !== undefined) {
      const cleanName = String(gemstone_type).trim();
      if (!cleanName) {
        return res.status(400).json({ success: false, message: 'Gemstone name cannot be empty' });
      }
      fields.gemstone_type = cleanName;
    }
    if (currency !== undefined) fields.currency = String(currency).trim().toUpperCase() || 'PKR';
    if (category !== undefined) fields.category = String(category).trim() || 'Precious Gem';
    if (mineral_family !== undefined) fields.mineral_family = mineral_family ? String(mineral_family).trim() : null;
    if (mohs_hardness !== undefined) fields.mohs_hardness = mohs_hardness ? String(mohs_hardness).trim() : null;
    if (primary_origins !== undefined) fields.primary_origins = primary_origins ? String(primary_origins).trim() : null;
    if (characteristics !== undefined) fields.characteristics = characteristics ? String(characteristics).trim() : null;
    if (description !== undefined) fields.description = description ? String(description).trim() : null;
    if (info_source_name !== undefined) fields.info_source_name = info_source_name ? String(info_source_name).trim() : null;
    if (info_source_url !== undefined) fields.info_source_url = info_source_url ? String(info_source_url).trim() : null;
    if (price_source_name !== undefined) fields.price_source_name = price_source_name ? String(price_source_name).trim() : null;
    if (price_source_url !== undefined) fields.price_source_url = price_source_url ? String(price_source_url).trim() : null;

    if (req.file) {
      fields.image_url = `/uploads/${req.file.filename}`;
    } else if (req.body.image_url !== undefined) {
      fields.image_url = req.body.image_url || null;
    }

    const updated = await Price.update(id, fields);

    res.json({ success: true, message: 'Gemstone updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

// ─── Delete price entry ───────────────────────────────────────────────────────
exports.deletePrice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await Price.findById(id);
    const deleted = await Price.deleteById(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Gemstone entry not found' });
    }

    if (existing?.image_url && existing.image_url.startsWith('/uploads/')) {
      const diskPath = path.join(__dirname, '../../', existing.image_url);
      fs.unlink(diskPath, () => {});
    }

    res.json({ success: true, message: 'Gemstone removed successfully' });
  } catch (error) {
    next(error);
  }
};

// ─── Update report review / authenticity / notes ──────────────────────────────
exports.updateReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { review_status, admin_notes, authenticity } = req.body;

    const validStatuses = ['Pending', 'Under Review', 'Verified', 'Dismissed'];
    if (review_status !== undefined && !validStatuses.includes(review_status)) {
      return res.status(400).json({ success: false, message: 'Invalid report status value' });
    }

    const validAuth = ['real', 'synthetic', 'uncertain'];
    if (authenticity !== undefined && !validAuth.includes(authenticity)) {
      return res.status(400).json({ success: false, message: 'Invalid authenticity value' });
    }

    const updated = await Report.updateById(id, {
      ...(review_status !== undefined && { review_status }),
      ...(admin_notes !== undefined && { admin_notes: admin_notes ? String(admin_notes).trim() : null }),
      ...(authenticity !== undefined && { authenticity }),
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.json({ success: true, message: 'Report updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

// ─── Delete report ────────────────────────────────────────────────────────────
exports.deleteReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Report.deleteById(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ─── Live DB-derived activity notifications with persisted read/dismiss state ───
async function buildNotificationsForAdmin(adminId) {
  const [recentReports, recentUsers, recentPrices, stateRows] = await Promise.all([
    query(`
      SELECT r.id, r.gemstone_type, r.authenticity, r.confidence, r.price_range,
             r.createdAt, u.full_name AS user_name, u.email AS user_email
      FROM reports r
      LEFT JOIN users u ON u.id = r.user_id
      ORDER BY r.createdAt DESC
      LIMIT 15
    `),
    query(`
      SELECT id, full_name, email, status, createdAt
      FROM users
      ORDER BY createdAt DESC
      LIMIT 10
    `),
    query(`
      SELECT id, gemstone_type, price_per_carat, currency, updatedAt
      FROM prices
      ORDER BY updatedAt DESC
      LIMIT 10
    `),
    query(
      'SELECT notification_id, is_read, is_dismissed FROM admin_notification_states WHERE admin_id = ?',
      [adminId]
    ).catch(() => []),
  ]);

  const stateMap = new Map();
  for (const row of stateRows) {
    stateMap.set(row.notification_id, row);
  }

  const rawItems = [];

  for (const r of recentReports) {
    const pct = Number(r.confidence) <= 1
      ? `${Math.round(Number(r.confidence) * 100)}%`
      : `${Math.round(Number(r.confidence))}%`;
    const authLabel = r.authenticity
      ? r.authenticity.charAt(0).toUpperCase() + r.authenticity.slice(1)
      : 'Uncertain';
    rawItems.push({
      id: `report-${r.id}`,
      category: 'Report',
      title: `Scan Report #${r.id}: ${r.gemstone_type}`,
      message: `Submitted by ${r.user_email || r.user_name || 'User'} • Authenticity: ${authLabel} (${pct})`,
      timestamp: r.createdAt,
      targetPath: '/reports',
    });
  }

  for (const u of recentUsers) {
    rawItems.push({
      id: `user-${u.id}`,
      category: 'User',
      title: `User Registered: ${u.full_name || u.email}`,
      message: `${u.email} • Status: ${u.status || 'active'}`,
      timestamp: u.createdAt,
      targetPath: '/users',
    });
  }

  for (const p of recentPrices) {
    rawItems.push({
      id: `price-${p.id}`,
      category: 'Catalog',
      title: `Catalog Entry: ${p.gemstone_type}`,
      message: `${Number(p.price_per_carat).toLocaleString()} ${p.currency || 'PKR'}/ct`,
      timestamp: p.updatedAt,
      targetPath: '/gems',
    });
  }

  rawItems.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const visibleItems = rawItems
    .slice(0, 25)
    .filter((item) => !stateMap.get(item.id)?.is_dismissed)
    .map((item) => ({
      ...item,
      read: Boolean(stateMap.get(item.id)?.is_read),
    }));

  const unreadCount = visibleItems.filter((item) => !item.read).length;
  return { items: visibleItems, unreadCount };
}

exports.getNotifications = async (req, res, next) => {
  try {
    const { items, unreadCount } = await buildNotificationsForAdmin(req.user.id);
    res.json({
      success: true,
      count: items.length,
      unreadCount,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

exports.markNotificationRead = async (req, res, next) => {
  try {
    const notificationId = String(req.params.id || '').trim();
    if (!notificationId) {
      return res.status(400).json({ success: false, message: 'Notification ID is required' });
    }

    await query(
      `INSERT INTO admin_notification_states (admin_id, notification_id, is_read, is_dismissed)
       VALUES (?, ?, 1, 0)
       ON DUPLICATE KEY UPDATE is_read = 1, updated_at = NOW()`,
      [req.user.id, notificationId]
    );

    const { unreadCount } = await buildNotificationsForAdmin(req.user.id);
    res.json({
      success: true,
      message: 'Notification marked as read',
      data: { id: notificationId, read: true, unreadCount },
    });
  } catch (error) {
    next(error);
  }
};

exports.markAllNotificationsRead = async (req, res, next) => {
  try {
    const { items } = await buildNotificationsForAdmin(req.user.id);
    for (const item of items) {
      if (!item.read) {
        await query(
          `INSERT INTO admin_notification_states (admin_id, notification_id, is_read, is_dismissed)
           VALUES (?, ?, 1, 0)
           ON DUPLICATE KEY UPDATE is_read = 1, updated_at = NOW()`,
          [req.user.id, item.id]
        );
      }
    }

    res.json({
      success: true,
      message: 'All notifications marked as read',
      data: { unreadCount: 0 },
    });
  } catch (error) {
    next(error);
  }
};

exports.dismissNotification = async (req, res, next) => {
  try {
    const notificationId = String(req.params.id || '').trim();
    if (!notificationId) {
      return res.status(400).json({ success: false, message: 'Notification ID is required' });
    }

    await query(
      `INSERT INTO admin_notification_states (admin_id, notification_id, is_read, is_dismissed)
       VALUES (?, ?, 1, 1)
       ON DUPLICATE KEY UPDATE is_read = 1, is_dismissed = 1, updated_at = NOW()`,
      [req.user.id, notificationId]
    );

    const { unreadCount } = await buildNotificationsForAdmin(req.user.id);
    res.json({
      success: true,
      message: 'Notification dismissed',
      data: { id: notificationId, unreadCount },
    });
  } catch (error) {
    next(error);
  }
};

exports.dismissAllNotifications = async (req, res, next) => {
  try {
    const { items } = await buildNotificationsForAdmin(req.user.id);
    for (const item of items) {
      await query(
        `INSERT INTO admin_notification_states (admin_id, notification_id, is_read, is_dismissed)
         VALUES (?, ?, 1, 1)
         ON DUPLICATE KEY UPDATE is_read = 1, is_dismissed = 1, updated_at = NOW()`,
        [req.user.id, item.id]
      );
    }

    res.json({
      success: true,
      message: 'All notifications cleared',
      data: { unreadCount: 0 },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Block / Unblock user ─────────────────────────────────────────────────────
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'blocked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "active" or "blocked"'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updated = await User.updateStatus(id, status);

    res.json({
      success: true,
      message: `User ${status === 'blocked' ? 'blocked' : 'unblocked'} successfully`,
      data: { id: updated.id, email: updated.email, status: updated.status }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    next(error);
  }
};

// ─── Delete user permanently ──────────────────────────────────────────────────
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.email && req.user?.email && user.email.toLowerCase() === req.user.email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the active administrator account'
      });
    }

    const deleted = await User.deleteById(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    next(error);
  }
};

// ─── Get admin profile ────────────────────────────────────────────────────────
exports.getAdminProfile = async (req, res, next) => {
  try {
    const admin = await Admin.findByIdSafe(req.user.id);

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    res.json({
      success: true,
      data: {
        id:              admin.id,
        full_name:       admin.full_name,
        email:           admin.email,
        profile_picture: admin.profile_picture,
        createdAt:       admin.created_at,
        updatedAt:       admin.updated_at
      }
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    next(error);
  }
};

// ─── Update admin profile ─────────────────────────────────────────────────────
exports.updateAdminProfile = async (req, res, next) => {
  try {
    const { full_name, email } = req.body;

    if (email) {
      const taken = await Admin.emailExistsForOther(email, req.user.id);
      if (taken) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
    }

    const updated = await Admin.updateProfile(req.user.id, { full_name, email });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id:              updated.id,
        full_name:       updated.full_name,
        email:           updated.email,
        profile_picture: updated.profile_picture
      }
    });
  } catch (error) {
    console.error('Update admin profile error:', error);
    next(error);
  }
};

// ─── Change admin password ────────────────────────────────────────────────────
exports.changeAdminPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    const isValid = await Admin.comparePassword(currentPassword, admin.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    await Admin.updatePassword(req.user.id, newPassword);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change admin password error:', error);
    next(error);
  }
};

// ─── Update profile picture ───────────────────────────────────────────────────
exports.updateProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Profile picture file is required' });
    }

    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    const picturePath = `/uploads/${req.file.filename}`;
    await Admin.updateProfilePicture(req.user.id, picturePath);

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      data: { profile_picture: picturePath }
    });
  } catch (error) {
    console.error('Update profile picture error:', error);
    next(error);
  }
};
