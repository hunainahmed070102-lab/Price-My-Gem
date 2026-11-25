const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

const resetTestUser = async () => {
  try {
    console.log('🔄 Resetting test user...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pricemygem_db');
    console.log('✅ Connected to MongoDB');

    // Delete existing test user
    await User.deleteOne({ email: 'test@user.com' });
    console.log('🗑️  Deleted existing test user');

    // Create new test user
    const testUser = new User({
      email: 'test@user.com',
      password: 'test123',
      role: 'user'
    });
    await testUser.save();
    
    console.log('✅ Test user created successfully!');
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('  📱 MOBILE APP TEST CREDENTIALS');
    console.log('═══════════════════════════════════════');
    console.log('  📧 Email:    test@user.com');
    console.log('  🔑 Password: test123');
    console.log('  👤 Role:     user');
    console.log('═══════════════════════════════════════');
    console.log('');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

resetTestUser();
