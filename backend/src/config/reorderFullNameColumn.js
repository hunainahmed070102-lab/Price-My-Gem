const { sequelize } = require('./database');

async function reorderFullNameColumn() {
  try {
    console.log('Checking full_name column position...');
    
    // Check current column order
    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME, ORDINAL_POSITION 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('\nCurrent column order:');
    columns.forEach(col => {
      console.log(`  ${col.ORDINAL_POSITION}. ${col.COLUMN_NAME}`);
    });
    
    // Check if full_name exists
    const fullNameColumn = columns.find(col => col.COLUMN_NAME === 'full_name');
    
    if (!fullNameColumn) {
      console.log('\n❌ full_name column does not exist');
      process.exit(1);
      return;
    }
    
    // Check if it's already after id (position 2)
    if (fullNameColumn.ORDINAL_POSITION === 2) {
      console.log('\n✅ full_name column is already in the correct position (after id)');
      process.exit(0);
      return;
    }
    
    console.log('\nMoving full_name column to be after id...');
    
    // Move column to be after id
    await sequelize.query(`
      ALTER TABLE users 
      MODIFY COLUMN full_name VARCHAR(255) AFTER id
    `);
    
    console.log('✅ Successfully moved full_name column');
    
    // Show new column order
    const [newColumns] = await sequelize.query(`
      SELECT COLUMN_NAME, ORDINAL_POSITION 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('\nNew column order:');
    newColumns.forEach(col => {
      console.log(`  ${col.ORDINAL_POSITION}. ${col.COLUMN_NAME}`);
    });
    
    console.log('\n✅ Column reordering completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error reordering full_name column:', error.message);
    process.exit(1);
  }
}

reorderFullNameColumn();
