const { query } = require('./database');

const PRECIOUS_PATTERNS = [
  'diamond',
  'ruby',
  'sapphire',
  'emerald',
  'alexandrite',
  'tanzanite',
  'tsavorite',
  'spinel',
  'bixbite',
  'benitoite',
];

const ORGANIC_PATTERNS = ['pearl', 'amber', 'coral', 'jet', 'nacre', 'shell'];

function inferCategory(gemstoneType = '') {
  const lower = String(gemstoneType).toLowerCase();
  if (ORGANIC_PATTERNS.some((p) => lower.includes(p))) return 'Organic Gem';
  if (PRECIOUS_PATTERNS.some((p) => lower.includes(p))) return 'Precious Gem';
  return 'Semi-Precious';
}

/**
 * Ensures additive columns used by the refined Admin Dashboard exist on MySQL
 * without altering or overwriting existing user/gemstone/report records.
 */
async function ensureSchemaColumns() {
  const priceCols = await query('SHOW COLUMNS FROM prices');
  const priceColNames = new Set(priceCols.map((c) => c.Field));

  if (!priceColNames.has('image_url')) {
    await query('ALTER TABLE prices ADD COLUMN image_url VARCHAR(500) DEFAULT NULL AFTER price_source_url');
  }

  let addedCategory = false;
  if (!priceColNames.has('category')) {
    await query("ALTER TABLE prices ADD COLUMN category VARCHAR(80) NOT NULL DEFAULT 'Semi-Precious' AFTER currency");
    addedCategory = true;
  }

  if (addedCategory) {
    const existingPrices = await query('SELECT id, gemstone_type FROM prices');
    for (const row of existingPrices) {
      const cat = inferCategory(row.gemstone_type);
      if (cat !== 'Semi-Precious') {
        await query('UPDATE prices SET category = ? WHERE id = ?', [cat, row.id]);
      }
    }
  }

  const reportCols = await query('SHOW COLUMNS FROM reports');
  const reportColNames = new Set(reportCols.map((c) => c.Field));

  if (!reportColNames.has('review_status')) {
    await query("ALTER TABLE reports ADD COLUMN review_status VARCHAR(40) NOT NULL DEFAULT 'Pending' AFTER price_range");
  }
  if (!reportColNames.has('admin_notes')) {
    await query('ALTER TABLE reports ADD COLUMN admin_notes TEXT DEFAULT NULL AFTER review_status');
  }

  await query(`
    CREATE TABLE IF NOT EXISTS admin_notification_states (
      id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
      admin_id        INT UNSIGNED NOT NULL,
      notification_id VARCHAR(120) NOT NULL,
      is_read         TINYINT(1)   NOT NULL DEFAULT 0,
      is_dismissed    TINYINT(1)   NOT NULL DEFAULT 0,
      updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_admin_notification (admin_id, notification_id),
      KEY idx_admin_notif_admin (admin_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

module.exports = { ensureSchemaColumns, inferCategory };
