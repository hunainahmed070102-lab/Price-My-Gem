/**
 * Test script to verify users API returns correct data
 */

require('dotenv').config();
const User = require('./src/models/User');
const { connectDB } = require('./src/config/database');

async function testUsersAPI() {
  try {
    console.log('🔄 Connecting to database...');
    const connected = await connectDB();
    if (!connected) {
      console.log('❌ Could not connect to MySQL');
      process.exit(1);
    }
    console.log('✅ Database connected\n');

    console.log('📊 Fetching all users from database:');
    const users = await User.getAll();

    console.log(`Total users: ${users.length}\n`);

    if (users.length === 0) {
      console.log('ℹ️  No users found in database yet. (Users can register via mobile app or auth API)');
    } else {
      console.log('Users list:');
      console.table(users.map(u => ({
        id: u.id,
        full_name: u.full_name,
        email: u.email,
        status: u.status,
        created: new Date(u.created_at).toLocaleString()
      })));
    }

    console.log('\n✅ API would return:');
    console.log(JSON.stringify({
      success: true,
      count: users.length,
      data: users
    }, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

testUsersAPI();
