const { sequelize } = require('./src/config/database');

async function checkUsers() {
  try {
    const [users] = await sequelize.query('SELECT id, full_name, email, role FROM users');
    
    console.log('📋 Users in database:\n');
    if (users.length === 0) {
      console.log('No users found');
    } else {
      users.forEach(user => {
        console.log(`ID: ${user.id}`);
        console.log(`Full Name: ${user.full_name || '(not set)'}`);
        console.log(`Email: ${user.email}`);
        console.log(`Role: ${user.role}`);
        console.log('---');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUsers();
