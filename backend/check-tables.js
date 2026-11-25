require('dotenv').config();
const { connectDB, query } = require('./src/config/database');

async function checkTables() {
  try {
    const connected = await connectDB();
    if (!connected) {
      console.log('❌ Could not connect to MySQL');
      process.exit(1);
    }
    console.log('✅ Database connected\n');

    console.log('═══════════════════════════════════════════');
    console.log('📊 Database Tables Status');
    console.log('═══════════════════════════════════════════\n');

    // Admins
    const admins = await query('SELECT id, full_name, email, createdAt FROM admins');
    console.log(`ADMINS TABLE (${admins.length} records):`);
    if (admins.length > 0) {
      admins.forEach((admin, index) => {
        console.log(`  ${index + 1}. ID: ${admin.id} | Email: ${admin.email} | Name: ${admin.full_name || 'Not set'}`);
      });
    } else {
      console.log('  (empty)');
    }
    console.log('');

    // Users
    const users = await query('SELECT id, full_name, email, status, createdAt FROM users');
    console.log(`USERS TABLE (${users.length} records):`);
    if (users.length > 0) {
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ID: ${user.id} | Email: ${user.email} | Name: ${user.full_name || 'Not set'} | Status: ${user.status}`);
      });
    } else {
      console.log('  (empty)');
    }
    console.log('');

    // Prices
    const prices = await query('SELECT id, gemstone_type, price_per_carat, currency FROM prices');
    console.log(`PRICES TABLE (${prices.length} records):`);
    prices.forEach(p => {
      console.log(`  • ${p.gemstone_type}: Rs ${Number(p.price_per_carat).toLocaleString()}/${p.currency}`);
    });
    console.log('');

    // Reports
    const reports = await query('SELECT id, user_id, gemstone_type, authenticity, price_range FROM reports');
    console.log(`REPORTS TABLE (${reports.length} records):`);
    if (reports.length > 0) {
      reports.forEach(r => console.log(`  • #${r.id} | Gem: ${r.gemstone_type} | Auth: ${r.authenticity}`));
    } else {
      console.log('  (empty)');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkTables();
