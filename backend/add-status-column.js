/**
 * Migration Script: Add status column to users table
 * 
 * This script adds a 'status' column with ENUM('active', 'blocked')
 * to the users table with a default value of 'active'.
 */

require('dotenv').config();
const { sequelize } = require('./src/config/database');

async function addStatusColumn() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connected successfully');

    console.log('\nChecking if status column exists...');
    
    // Check if column already exists
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'status'
    `);

    if (results.length > 0) {
      console.log('Status column already exists');
      
      // Verify it's the correct type
      console.log('\n🔄 Verifying column type...');
      const [columnInfo] = await sequelize.query(`
        SELECT COLUMN_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'users' 
          AND COLUMN_NAME = 'status'
      `);
      
      console.log(`   Current column type: ${columnInfo[0].COLUMN_TYPE}`);
      
      if (!columnInfo[0].COLUMN_TYPE.includes("'active'") || !columnInfo[0].COLUMN_TYPE.includes("'blocked'")) {
        console.log('\n⚠️  Status column exists but has wrong type. Updating...');
        await sequelize.query(`
          ALTER TABLE users 
          MODIFY COLUMN status ENUM('active', 'blocked') NOT NULL DEFAULT 'active'
        `);
        console.log('✅ Status column updated successfully');
      } else {
        console.log('✅ Status column has correct type');
      }
    } else {
      console.log('ℹ️  Status column does not exist. Adding...');
      
      // Add the status column
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN status ENUM('active', 'blocked') NOT NULL DEFAULT 'active'
      `);
      
      console.log('✅ Status column added successfully');
    }

    // Set all existing users to 'active' status
    console.log('\n🔄 Ensuring all existing users have active status...');
    const [updateResult] = await sequelize.query(`
      UPDATE users 
      SET status = 'active' 
      WHERE status IS NULL OR status = ''
    `);
    
    console.log(`✅ Updated ${updateResult.affectedRows || 0} users to active status`);

    // Show current status distribution
    console.log('\n📊 Current user status distribution:');
    const [statusDistribution] = await sequelize.query(`
      SELECT status, COUNT(*) as count 
      FROM users 
      GROUP BY status
    `);
    
    console.table(statusDistribution);

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   - Status column is ready');
    console.log('   - All existing users set to "active"');
    console.log('   - Admins can now block/unblock users from dashboard');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run migration
console.log('🚀 Starting User Status Column Migration\n');
console.log('=' .repeat(50));
addStatusColumn();
