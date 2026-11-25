/**
 * Migration Script: Reorder status column in users table
 * 
 * This script moves the status column to appear right after the email column.
 * Column order will be: id, full_name, email, status, password, createdAt, updatedAt
 */

require('dotenv').config();
const { sequelize } = require('./src/config/database');

async function reorderStatusColumn() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    console.log('\n📋 Current table structure:');
    const [currentColumns] = await sequelize.query(`
      SELECT COLUMN_NAME, ORDINAL_POSITION, COLUMN_TYPE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.table(currentColumns.map(col => ({
      Position: col.ORDINAL_POSITION,
      Column: col.COLUMN_NAME,
      Type: col.COLUMN_TYPE,
      Default: col.COLUMN_DEFAULT
    })));

    console.log('\n🔄 Reordering status column to appear after email...');
    
    // MySQL ALTER COLUMN with AFTER clause to reposition the column
    await sequelize.query(`
      ALTER TABLE users 
      MODIFY COLUMN status ENUM('active', 'blocked') NOT NULL DEFAULT 'active'
      AFTER email
    `);
    
    console.log('✅ Status column reordered successfully');

    console.log('\n📋 New table structure:');
    const [newColumns] = await sequelize.query(`
      SELECT COLUMN_NAME, ORDINAL_POSITION, COLUMN_TYPE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.table(newColumns.map(col => ({
      Position: col.ORDINAL_POSITION,
      Column: col.COLUMN_NAME,
      Type: col.COLUMN_TYPE,
      Default: col.COLUMN_DEFAULT
    })));

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Column order is now:');
    console.log('   1. id');
    console.log('   2. full_name');
    console.log('   3. email');
    console.log('   4. status ← Moved here');
    console.log('   5. password');
    console.log('   6. createdAt');
    console.log('   7. updatedAt');

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
console.log('🚀 Reordering Status Column in Users Table\n');
console.log('=' .repeat(50));
reorderStatusColumn();
