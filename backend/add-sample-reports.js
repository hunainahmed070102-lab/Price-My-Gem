require('dotenv').config();
const { connectDB, query } = require('./src/config/database');
const User = require('./src/models/User');
const Report = require('./src/models/Report');

async function addSampleReports() {
  try {
    const connected = await connectDB();
    if (!connected) {
      console.log('❌ Could not connect to MySQL');
      process.exit(1);
    }
    console.log('✅ Database connected\n');

    // Find or create test user
    let user = await User.findByEmail('user@test.com');
    if (!user) {
      console.log('Creating test user user@test.com...');
      user = await User.create({
        full_name: 'Test Mobile User',
        email: 'user@test.com',
        password: 'password123'
      });
      console.log('✅ Created user@test.com / password123');
    }

    console.log(`✅ User ready: ${user.email} (ID: ${user.id})\n`);

    // Sample reports
    const sampleReports = [
      {
        user_id: user.id,
        image_url: '/uploads/gemstone-1.jpg',
        gemstone_type: 'Diamond',
        confidence: 0.958,
        authenticity: 'real',
        price_range: '500,000 PKR/carat'
      },
      {
        user_id: user.id,
        image_url: '/uploads/gemstone-2.jpg',
        gemstone_type: 'Ruby',
        confidence: 0.883,
        authenticity: 'real',
        price_range: '250,000 PKR/carat'
      },
      {
        user_id: user.id,
        image_url: '/uploads/gemstone-3.jpg',
        gemstone_type: 'Sapphire',
        confidence: 0.921,
        authenticity: 'synthetic',
        price_range: '200,000 PKR/carat'
      },
      {
        user_id: user.id,
        image_url: '/uploads/gemstone-4.jpg',
        gemstone_type: 'Emerald',
        confidence: 0.764,
        authenticity: 'uncertain',
        price_range: '180,000 PKR/carat'
      },
      {
        user_id: user.id,
        image_url: '/uploads/gemstone-5.jpg',
        gemstone_type: 'Topaz',
        confidence: 0.915,
        authenticity: 'real',
        price_range: '50,000 PKR/carat'
      },
      {
        user_id: user.id,
        image_url: '/uploads/gemstone-6.jpg',
        gemstone_type: 'Amethyst',
        confidence: 0.857,
        authenticity: 'real',
        price_range: '25,000 PKR/carat'
      }
    ];

    console.log('📝 Creating sample reports...\n');

    for (const reportData of sampleReports) {
      await Report.create(reportData);
      console.log(`✅ Created ${reportData.gemstone_type} report (${(reportData.confidence * 100).toFixed(1)}% confidence)`);
    }

    const totalReports = await Report.count();
    console.log(`\n📊 Total reports in database: ${totalReports}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addSampleReports();
