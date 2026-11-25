const { query } = require('../config/database');

const PRICE_COLUMNS = `
  id, gemstone_type, price_per_carat, currency, category,
  mineral_family, mohs_hardness, primary_origins,
  characteristics, description,
  info_source_name, info_source_url,
  price_source_name, price_source_url, image_url,
  createdAt, updatedAt,
  createdAt AS created_at, updatedAt AS updated_at
`;

const attachSources = (row, sources = []) => {
  if (!row) return null;
  return {
    ...row,
    sources,
  };
};

const Price = {
  // ── Get all prices with metadata & associated sources ────────────────────────
  getAll: async () => {
    const [prices, allSources] = await Promise.all([
      query(`SELECT ${PRICE_COLUMNS} FROM prices ORDER BY id ASC`),
      query(
        'SELECT id, price_id, gemstone_type, source_type, source_name, source_url, reference_note FROM gemstone_sources ORDER BY price_id ASC, id ASC'
      ).catch(() => []),
    ]);

    const sourceMap = new Map();
    for (const src of allSources) {
      if (!sourceMap.has(src.price_id)) {
        sourceMap.set(src.price_id, []);
      }
      sourceMap.get(src.price_id).push(src);
    }

    return prices.map((row) => attachSources(row, sourceMap.get(row.id) || []));
  },

  // ── Find by gemstone type (with associated sources) ──────────────────────────
  findByType: async (gemstoneType) => {
    const rows = await query(
      `SELECT ${PRICE_COLUMNS} FROM prices WHERE gemstone_type = ? LIMIT 1`,
      [gemstoneType]
    );
    const row = rows[0] || null;
    if (!row) return null;

    const sources = await query(
      'SELECT id, price_id, gemstone_type, source_type, source_name, source_url, reference_note FROM gemstone_sources WHERE price_id = ? ORDER BY id ASC',
      [row.id]
    ).catch(() => []);

    return attachSources(row, sources);
  },

  // ── Find by id ───────────────────────────────────────────────────────────────
  findById: async (id) => {
    const rows = await query(
      `SELECT ${PRICE_COLUMNS} FROM prices WHERE id = ? LIMIT 1`,
      [id]
    );
    const row = rows[0] || null;
    if (!row) return null;

    const sources = await query(
      'SELECT id, price_id, gemstone_type, source_type, source_name, source_url, reference_note FROM gemstone_sources WHERE price_id = ? ORDER BY id ASC',
      [row.id]
    ).catch(() => []);

    return attachSources(row, sources);
  },

  // ── Create gemstone price entry ─────────────────────────────────────────────
  create: async (data) => {
    const result = await query(
      `INSERT INTO prices (
        gemstone_type, price_per_carat, currency, category,
        mineral_family, mohs_hardness, primary_origins,
        characteristics, description,
        info_source_name, info_source_url,
        price_source_name, price_source_url, image_url,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        data.gemstone_type,
        data.price_per_carat,
        data.currency || 'PKR',
        data.category || 'Precious Gem',
        data.mineral_family || null,
        data.mohs_hardness || null,
        data.primary_origins || null,
        data.characteristics || null,
        data.description || null,
        data.info_source_name || null,
        data.info_source_url || null,
        data.price_source_name || null,
        data.price_source_url || null,
        data.image_url || null,
      ]
    );
    return Price.findById(result.insertId);
  },

  // ── Update gemstone fields (price and/or metadata + image) ──────────────────
  update: async (id, fields = {}) => {
    const allowed = [
      'gemstone_type',
      'price_per_carat',
      'currency',
      'category',
      'mineral_family',
      'mohs_hardness',
      'primary_origins',
      'characteristics',
      'description',
      'info_source_name',
      'info_source_url',
      'price_source_name',
      'price_source_url',
      'image_url',
    ];

    const assignments = [];
    const values = [];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        assignments.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }

    if (assignments.length === 0) {
      return Price.findById(id);
    }

    assignments.push('updatedAt = NOW()');
    values.push(id);

    const updated = await query(
      `UPDATE prices SET ${assignments.join(', ')} WHERE id = ?`,
      values
    );
    if (updated.affectedRows === 0) return null;
    return Price.findById(id);
  },

  // ── Update price per carat ───────────────────────────────────────────────────
  updatePricePerCarat: async (id, pricePerCarat) => {
    const updated = await query(
      'UPDATE prices SET price_per_carat = ?, updatedAt = NOW() WHERE id = ?',
      [pricePerCarat, id]
    );
    if (updated.affectedRows === 0) return null;
    return Price.findById(id);
  },

  // ── Delete price record by id ────────────────────────────────────────────────
  deleteById: async (id) => {
    const result = await query('DELETE FROM prices WHERE id = ?', [id]);
    return result.affectedRows;
  },

  // ── Count total ──────────────────────────────────────────────────────────────
  count: async () => {
    const rows = await query('SELECT COUNT(*) AS total FROM prices');
    return rows[0].total;
  }
};

module.exports = Price;
