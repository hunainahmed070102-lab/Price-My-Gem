const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

const createTestUser = async () => {
  try {
    console.log('👤 Creating test user for mobile app...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pricemygem_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@user.com' });
    
    if (existingUser) {
      console.log('ℹ️  Test user already exists');
      console.log('📧 Email: test@user.com');
      console.log('🔑 Password: test123');
      await mongoose.connection.close();
      process.exit(0);
      return;
    }

    // Create test user (regular user, not admin)
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
    console.error('❌ Failed to create test user:', error.message);
    process.exit(1);
  }
};

// Run
createTestUser();
