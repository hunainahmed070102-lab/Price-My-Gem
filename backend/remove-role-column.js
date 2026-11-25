const { sequelize } = require('./src/config/database');

async function removeRoleColumn() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Drop role column from users table
    console.log('Removing role column from users table...');
    try {
      await sequelize.query('ALTER TABLE users DROP COLUMN role');
      console.log('✅ Removed role column from users table\n');
    } catch (error) {
      if (error.original?.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('ℹ️  Role column already removed from users table\n');
      } else {
        throw error;
      }
    }

    // Drop role column from admins table
    console.log('Removing role column from admins table...');
    try {
      await sequelize.query('ALTER TABLE admins DROP COLUMN role');
      console.log('✅ Removed role column from admins table\n');
    } catch (error) {
      if (error.original?.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('ℹ️  Role column already removed from admins table\n');
      } else {
        throw error;
      }
    }

    console.log('═══════════════════════════════════════════');
    console.log('🎉 Role columns removed successfully!');
    console.log('═══════════════════════════════════════════\n');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

removeRoleColumn();
