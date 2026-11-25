const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

const createAllTestUsers = async () => {
  try {
    console.log('👥 Creating all test users...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pricemygem_db');
    console.log('✅ Connected to MongoDB');

    const testUsers = [
      { email: 'user@test.com', password: '123456', role: 'user' },
      { email: 'test@user.com', password: 'test123', role: 'user' },
      { email: 'admin@pricemygem.com', password: 'admin123', role: 'admin' }
    ];

    for (const userData of testUsers) {
      // Delete if exists
      await User.deleteOne({ email: userData.email });
      
      // Create new user
      const user = new User(userData);
      await user.save();
      
      console.log(`✅ Created: ${userData.email} (${userData.role})`);
    }

    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('  📱 TEST CREDENTIALS');
    console.log('═══════════════════════════════════════');
    console.log('  Mobile App Users:');
    console.log('  📧 user@test.com / 🔑 123456');
    console.log('  📧 test@user.com / 🔑 test123');
    console.log('');
    console.log('  Web Admin:');
    console.log('  📧 admin@pricemygem.com / 🔑 admin123');
    console.log('═══════════════════════════════════════');
    console.log('');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createAllTestUsers();
