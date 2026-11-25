const { sequelize } = require('./database');

async function addFullNameColumn() {
  try {
    console.log('Checking if full_name column exists...');
    
    // Check if column exists
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'full_name'
    `);
    
    if (results.length > 0) {
      console.log('✅ full_name column already exists');
      process.exit(0);
      return;
    }
    
    console.log('Adding full_name column to users table...');
    
    await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN full_name VARCHAR(255) AFTER id
    `);
    
    console.log('✅ Successfully added full_name column to users table');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding full_name column:', error.message);
    process.exit(1);
  }
}

addFullNameColumn();
