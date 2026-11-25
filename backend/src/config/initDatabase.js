/**
 * initDatabase.js
 * Creates the pricemygem_db database and all required tables in XAMPP MySQL.
 * Run once:  node src/config/initDatabase.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_NAME = process.env.DB_NAME || 'pricemygem_db';

async function init() {
  // Connect WITHOUT specifying a database first so we can CREATE DATABASE
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    charset:  'utf8mb4',
    timezone: '+00:00'
  });

  console.log('Connected to MySQL. Creating database and tables...');

  // ── Database ────────────────────────────────────────────────────────────────
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await conn.query(`USE \`${DB_NAME}\``);
  console.log(`Database \`${DB_NAME}\` ready.`);

  // ── users ───────────────────────────────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id           INT UNSIGNED     NOT NULL AUTO_INCREMENT,
      full_name    VARCHAR(255)     DEFAULT NULL,
      email        VARCHAR(255)     NOT NULL,
      password     VARCHAR(255)     NOT NULL,
      status       ENUM('active','blocked') NOT NULL DEFAULT 'active',
      created_at   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_users_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('Table `users` ready.');

  // ── admins ──────────────────────────────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
      full_name       VARCHAR(255)  DEFAULT NULL,
      email           VARCHAR(255)  NOT NULL,
      password        VARCHAR(255)  NOT NULL,
      profile_picture VARCHAR(500)  DEFAULT NULL,
      reset_otp       VARCHAR(6)    DEFAULT NULL,
      reset_otp_expires DATETIME    DEFAULT NULL,
      created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_admins_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('Table `admins` ready.');

  // ── prices ──────────────────────────────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS prices (
      id                INT UNSIGNED    NOT NULL AUTO_INCREMENT,
      gemstone_type     VARCHAR(100)    NOT NULL,
      price_per_carat   DECIMAL(12,2)   NOT NULL,
      currency          VARCHAR(10)     NOT NULL DEFAULT 'PKR',
      category          VARCHAR(80)     NOT NULL DEFAULT 'Semi-Precious',
      mineral_family    VARCHAR(120)    DEFAULT NULL,
      mohs_hardness     VARCHAR(50)     DEFAULT NULL,
      primary_origins   VARCHAR(255)    DEFAULT NULL,
      characteristics   TEXT            DEFAULT NULL,
      description       TEXT            DEFAULT NULL,
      info_source_name  VARCHAR(150)    DEFAULT NULL,
      info_source_url   VARCHAR(500)    DEFAULT NULL,
      price_source_name VARCHAR(150)    DEFAULT NULL,
      price_source_url  VARCHAR(500)    DEFAULT NULL,
      image_url         VARCHAR(500)    DEFAULT NULL,
      createdAt         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                        ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_prices_gemstone (gemstone_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('Table `prices` ready.');

  // ── gemstone_sources ────────────────────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS gemstone_sources (
      id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
      price_id        INT UNSIGNED NOT NULL,
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
  console.log('Table `gemstone_sources` ready.');

  // ── reports ─────────────────────────────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS reports (
      id             INT UNSIGNED   NOT NULL AUTO_INCREMENT,
      user_id        INT UNSIGNED   NOT NULL,
      image_url      VARCHAR(500)   NOT NULL,
      gemstone_type  VARCHAR(100)   NOT NULL,
      confidence     DECIMAL(5,4)   NOT NULL COMMENT '0.0000 – 1.0000',
      authenticity   ENUM('real','synthetic','uncertain') NOT NULL,
      price_range    VARCHAR(200)   DEFAULT NULL,
      review_status  VARCHAR(40)    NOT NULL DEFAULT 'Pending',
      admin_notes    TEXT           DEFAULT NULL,
      created_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_reports_user_id   (user_id),
      KEY idx_reports_gemstone  (gemstone_type),
      KEY idx_reports_created   (created_at),
      CONSTRAINT fk_reports_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('Table `reports` ready.');

  // ── admin_notification_states ───────────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS admin_notification_states (
      id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
      admin_id        INT UNSIGNED NOT NULL,
      notification_id VARCHAR(120) NOT NULL,
      is_read         TINYINT(1)   NOT NULL DEFAULT 0,
      is_dismissed    TINYINT(1)   NOT NULL DEFAULT 0,
      updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                   ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_admin_notification (admin_id, notification_id),
      KEY idx_admin_notif_admin (admin_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('Table `admin_notification_states` ready.');

  await conn.end();
  console.log('\nDatabase initialisation complete!');
  console.log('Next step: run   npm run seed   to insert the default admin & gem prices.');
}

init().catch((err) => {
  console.error('Init failed:', err.message);
  process.exit(1);
});
