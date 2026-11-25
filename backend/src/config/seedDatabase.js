/**
 * seedDatabase.js
 * Ensures schema upgrades on `prices` + `gemstone_sources`, seeds the default
 * admin account, and populates all 88 gemstone varieties with their gemological
 * metadata, pricing benchmarks, and verified source citations.
 *
 * Run:  npm run seed
 */

const bcrypt = require('bcryptjs');
require('dotenv').config();
const mysql = require('mysql2/promise');
const { GEMSTONE_CATALOG } = require('./gemstoneCatalogData');

const DB_NAME = process.env.DB_NAME || 'pricemygem_db';

async function ensurePriceAndSourceSchema(conn) {
  const [cols] = await conn.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'prices'`,
    [DB_NAME]
  );
  const existingCols = new Set(cols.map((c) => c.COLUMN_NAME));

  const requiredColumns = [
    ['mineral_family', 'VARCHAR(120) DEFAULT NULL'],
    ['mohs_hardness', 'VARCHAR(50) DEFAULT NULL'],
    ['primary_origins', 'VARCHAR(255) DEFAULT NULL'],
    ['characteristics', 'TEXT DEFAULT NULL'],
    ['description', 'TEXT DEFAULT NULL'],
    ['info_source_name', 'VARCHAR(150) DEFAULT NULL'],
    ['info_source_url', 'VARCHAR(500) DEFAULT NULL'],
    ['price_source_name', 'VARCHAR(150) DEFAULT NULL'],
    ['price_source_url', 'VARCHAR(500) DEFAULT NULL'],
  ];

  for (const [colName, colDef] of requiredColumns) {
    if (!existingCols.has(colName)) {
      await conn.query(`ALTER TABLE prices ADD COLUMN \`${colName}\` ${colDef}`);
    }
  }

  const [idColRows] = await conn.query(
    `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'prices' AND COLUMN_NAME = 'id'`,
    [DB_NAME]
  );
  const priceIdType =
    idColRows[0]?.COLUMN_TYPE?.toLowerCase().includes('unsigned')
      ? 'INT UNSIGNED'
      : 'INT';

  await conn.query(`
    CREATE TABLE IF NOT EXISTS gemstone_sources (
      id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
      price_id        ${priceIdType} NOT NULL,
      gemstone_type   VARCHAR(100) NOT NULL,
      source_type     ENUM('gemology','characteristics','pricing') NOT NULL,
      source_name     VARCHAR(150) NOT NULL,
      source_url      VARCHAR(500) NOT NULL,
      reference_note  TEXT         DEFAULT NULL,
      createdAt       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                   ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_sources_price_id (price_id),
      KEY idx_sources_gemstone (gemstone_type),
      UNIQUE KEY uq_source_entry (price_id, source_type),
      CONSTRAINT fk_sources_price FOREIGN KEY (price_id)
        REFERENCES prices(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function seed() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: DB_NAME,
    charset:  'utf8mb4',
    timezone: '+00:00',
  });

  console.log(`Connected to \`${DB_NAME}\`. Ensuring schema & seeding...`);
  await ensurePriceAndSourceSchema(conn);

  // ── Admin ──────────────────────────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL || 'maqeelabidi72@gmail.com';
  const adminPass  = process.env.ADMIN_PASSWORD || 'admin123';
  const hash = await bcrypt.hash(adminPass, 10);

  const [existing] = await conn.execute(
    'SELECT id FROM admins WHERE email = ?',
    [adminEmail]
  );

  if (existing.length === 0) {
    await conn.execute(
      `INSERT INTO admins (full_name, email, password, createdAt, updatedAt)
       VALUES (?, ?, ?, NOW(), NOW())`,
      ['Price My Gem Administrator', adminEmail, hash]
    );
    console.log(`✅ Admin created: ${adminEmail} / ${adminPass}`);
  } else {
    console.log(`ℹ️ Admin already exists: ${adminEmail}`);
  }

  // ── Gemstone catalog, valuations & verified sources ────────────────────────
  let inserted = 0;
  let updated = 0;
  let sourcesUpserted = 0;

  for (const gem of GEMSTONE_CATALOG) {
    const [rows] = await conn.execute(
      'SELECT id FROM prices WHERE gemstone_type = ? LIMIT 1',
      [gem.gemstone_type]
    );

    let priceId;
    if (rows.length === 0) {
      const [res] = await conn.execute(
        `INSERT INTO prices (
          gemstone_type, price_per_carat, currency,
          mineral_family, mohs_hardness, primary_origins,
          characteristics, description,
          info_source_name, info_source_url,
          price_source_name, price_source_url,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          gem.gemstone_type,
          gem.price_per_carat,
          gem.currency,
          gem.mineral_family,
          gem.mohs_hardness,
          gem.primary_origins,
          gem.characteristics,
          gem.description,
          gem.info_source_name,
          gem.info_source_url,
          gem.price_source_name,
          gem.price_source_url,
        ]
      );
      priceId = res.insertId;
      inserted++;
    } else {
      priceId = rows[0].id;
      await conn.execute(
        `UPDATE prices SET
          mineral_family = ?,
          mohs_hardness = ?,
          primary_origins = ?,
          characteristics = ?,
          description = ?,
          info_source_name = ?,
          info_source_url = ?,
          price_source_name = ?,
          price_source_url = ?,
          updatedAt = NOW()
         WHERE id = ?`,
        [
          gem.mineral_family,
          gem.mohs_hardness,
          gem.primary_origins,
          gem.characteristics,
          gem.description,
          gem.info_source_name,
          gem.info_source_url,
          gem.price_source_name,
          gem.price_source_url,
          priceId,
        ]
      );
      updated++;
    }

    for (const src of gem.sources) {
      await conn.execute(
        `INSERT INTO gemstone_sources (
          price_id, gemstone_type, source_type, source_name, source_url, reference_note, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          gemstone_type = VALUES(gemstone_type),
          source_name = VALUES(source_name),
          source_url = VALUES(source_url),
          reference_note = VALUES(reference_note),
          updatedAt = NOW()`,
        [
          priceId,
          gem.gemstone_type,
          src.source_type,
          src.source_name,
          src.source_url,
          src.reference_note,
        ]
      );
      sourcesUpserted++;
    }
  }

  console.log(
    `✅ Catalog synced: ${inserted} inserted, ${updated} enriched (total ${GEMSTONE_CATALOG.length} varieties), ${sourcesUpserted} verified source records.`
  );
  await conn.end();
  console.log('Seeding complete!\n');
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
