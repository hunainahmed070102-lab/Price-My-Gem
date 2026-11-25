const { sequelize } = require('./database');
const User = require('../models/User');
const Admin = require('../models/Admin');

async function migrateToAdminTable() {
  try {
    console.log('🔄 Starting migration...\n');

    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Create admins table if it doesn't exist
    await Admin.sync({ force: true });
    console.log('✅ Admins table created\n');

    // Get all users
    const users = await User.findAll({ raw: true });
    console.log(`📊 Found ${users.length} users in database\n`);

    if (users.length > 0) {
      // Display current users
      console.log('Current users:');
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} (${user.role}) - ${user.full_name || 'No name'}`);
      });
      console.log('');

      // Move first user (admin) to admins table
      const adminUser = users[0];
      await Admin.create({
        full_name: adminUser.full_name,
        email: adminUser.email,
        password: adminUser.password, // Already hashed, skip hook
        role: 'admin',
        createdAt: adminUser.createdAt,
        updatedAt: adminUser.updatedAt
      }, {
        hooks: false // Skip password hashing since it's already hashed
      });
      console.log(`✅ Moved admin to admins table: ${adminUser.email}\n`);

      // Find Aqeel Abidi user
      const aqeelUser = users.find(u => 
        u.full_name && u.full_name.toLowerCase().includes('aqeel') && u.full_name.toLowerCase().includes('abidi')
      );

      if (!aqeelUser) {
        console.log('⚠️  Aqeel Abidi not found in users table. Creating new user...\n');
        // Create Aqeel Abidi user if not exists
        await User.create({
          full_name: 'Aqeel Abidi',
          email: 'aqeel@pricemygem.com',
          password: 'user123',
          role: 'user'
        });
        console.log('✅ Created Aqeel Abidi user (aqeel@pricemygem.com / user123)\n');
      } else {
        console.log(`✅ Keeping user: ${aqeelUser.full_name} (${aqeelUser.email})\n`);
      }

      // Delete all users except Aqeel Abidi
      const aqeelEmail = aqeelUser ? aqeelUser.email : 'aqeel@pricemygem.com';
      const deletedCount = await User.destroy({
        where: {
          email: {
            [sequelize.Sequelize.Op.ne]: aqeelEmail
          }
        }
      });
      console.log(`✅ Removed ${deletedCount} users from users table\n`);
    } else {
      console.log('⚠️  No users found. Creating default admin and user...\n');
      
      // Create admin in admins table
      await Admin.create({
        full_name: 'Admin',
        email: 'pricemygem@gmail.com',
        password: 'admin@123',
        role: 'admin'
      });
      console.log('✅ Created admin (pricemygem@gmail.com / admin@123)\n');

      // Create Aqeel Abidi user
      await User.create({
        full_name: 'Aqeel Abidi',
        email: 'aqeel@pricemygem.com',
        password: 'user123',
        role: 'user'
      });
      console.log('✅ Created Aqeel Abidi (aqeel@pricemygem.com / user123)\n');
    }

    // Display final state
    console.log('═══════════════════════════════════════════');
    console.log('📊 Final Database State:');
    console.log('═══════════════════════════════════════════\n');

    const admins = await Admin.findAll();
    console.log(`Admins table (${admins.length} records):`);
    admins.forEach(admin => {
      console.log(`  - ${admin.email} (${admin.full_name || 'No name'})`);
    });
    console.log('');

    const remainingUsers = await User.findAll();
    console.log(`Users table (${remainingUsers.length} records):`);
    remainingUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.full_name || 'No name'})`);
    });
    console.log('');

    console.log('═══════════════════════════════════════════');
    console.log('🎉 Migration completed successfully!');
    console.log('═══════════════════════════════════════════\n');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateToAdminTable();
