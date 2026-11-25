const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

const createSimpleUser = async () => {
  try {
    console.log('👤 Creating simple test user...');

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pricemygem_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');

    // Delete existing simple user if exists
    await User.deleteOne({ email: 'user@test.com' });

    // Create simple user
    const simpleUser = new User({
      email: 'user@test.com',
      password: '123456',
      role: 'user'
    });
    await simpleUser.save();
    
    console.log('✅ Simple user created successfully!');
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('  📱 SIMPLE TEST CREDENTIALS');
    console.log('═══════════════════════════════════════');
    console.log('  📧 Email:    user@test.com');
    console.log('  🔑 Password: 123456');
    console.log('  👤 Role:     user');
    console.log('═══════════════════════════════════════');
    console.log('');

    // Also show the other test user
    console.log('  OR USE:');
    console.log('  📧 Email:    test@user.com');
    console.log('  🔑 Password: test123');
    console.log('═══════════════════════════════════════');
    console.log('');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create user:', error.message);
    process.exit(1);
  }
};

createSimpleUser();
