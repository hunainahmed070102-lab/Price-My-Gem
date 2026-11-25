const mysql = require('mysql2/promise');
require('dotenv').config();

// ─── Connection Pool ───────────────────────────────────────────────────────────
let pool = null;

const createPool = () => {
  return mysql.createPool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'pricemygem_db',
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0,
    charset:            'utf8mb4',
    timezone:           '+00:00'
  });
};

// ─── Connect & verify ─────────────────────────────────────────────────────────
const connectDB = async () => {
  try {
    pool = createPool();
    // Test the connection
    const conn = await pool.getConnection();
    console.log('MySQL connected successfully');
    conn.release();
    return true;
  } catch (error) {
    console.error('MySQL connection failed:', error.message);
    console.error('Make sure XAMPP is running and MySQL is started.');
    console.error(`Host: ${process.env.DB_HOST || 'localhost'} | DB: ${process.env.DB_NAME || 'pricemygem_db'}`);
    return false;
  }
};

// ─── Execute a parameterised query ────────────────────────────────────────────
const query = async (sql, params = []) => {
  if (!pool) throw new Error('Database not initialised. Call connectDB() first.');
  const [rows] = await pool.execute(sql, params);
  return rows;
};

// ─── Get a raw connection (for transactions) ──────────────────────────────────
const getConnection = async () => {
  if (!pool) throw new Error('Database not initialised.');
  return pool.getConnection();
};

module.exports = { connectDB, query, getConnection };
