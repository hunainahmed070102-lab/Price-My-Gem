/**
 * Test admin login
 */

require('dotenv').config();
const Admin = require('./src/models/Admin');
const { connectDB } = require('./src/config/database');

async function testLogin() {
  try {
    const connected = await connectDB();
    if (!connected) {
      console.log('❌ Could not connect to MySQL');
      process.exit(1);
    }
    console.log('✅ Database connected\n');

    const email = 'pricemygem@gmail.com';
    console.log(`🔍 Looking for admin: ${email}`);
    const admin = await Admin.findByEmail(email);

    if (!admin) {
      console.log('❌ Admin not found!');
      process.exit(1);
    }

    console.log('✅ Admin found:', {
      id: admin.id,
      email: admin.email,
      full_name: admin.full_name
    });

    const passwordsToTry = [
      'admin123',
      'Admin123',
      'password',
      'Password123'
    ];

    console.log('\n🔐 Testing passwords...\n');
    for (const pwd of passwordsToTry) {
      const isValid = await Admin.comparePassword(pwd, admin.password);
      console.log(`  "${pwd}": ${isValid ? '✅ CORRECT' : '❌ wrong'}`);
      if (isValid) {
        console.log(`\n🎉 LOGIN SUCCESSFUL with password: "${pwd}"`);
        break;
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testLogin();
