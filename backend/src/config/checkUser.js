const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

const checkUser = async () => {
  try {
    console.log('🔍 Checking test user...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pricemygem_db');
    console.log('✅ Connected to MongoDB');

    // Find user
    const user = await User.findOne({ email: 'test@user.com' });
    
    if (!user) {
      console.log('❌ User not found!');
      await mongoose.connection.close();
      process.exit(1);
      return;
    }

    console.log('✅ User found:');
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);
    console.log('  Password Hash:', user.password);

    // Test password
    const testPassword = 'test123';
    const isMatch = await bcrypt.compare(testPassword, user.password);
    console.log('\n🔑 Password Test:');
    console.log('  Testing password:', testPassword);
    console.log('  Match:', isMatch ? '✅ YES' : '❌ NO');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkUser();
