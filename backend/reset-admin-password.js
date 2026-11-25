/**
 * Reset admin password to: admin123
 */

require('dotenv').config();
const Admin = require('./src/models/Admin');
const { sequelize } = require('./src/config/database');

async function resetPassword() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    const email = 'pricemygem@gmail.com';
    const newPassword = 'admin123';

    console.log(`🔍 Finding admin: ${email}`);
    const admin = await Admin.findOne({ where: { email } });

    if (!admin) {
      console.log('❌ Admin not found!');
      await sequelize.close();
      return;
    }

    console.log('✅ Admin found\n');
    console.log('🔄 Resetting password to: admin123');

    // Update password (the beforeUpdate hook will hash it automatically)
    admin.password = newPassword;
    await admin.save();

    console.log('✅ Password updated successfully!\n');

    // Verify the new password works
    const isValid = await admin.comparePassword(newPassword);
    console.log(`🔐 Password verification: ${isValid ? '✅ SUCCESS' : '❌ FAILED'}`);

    if (isValid) {
      console.log('\n🎉 You can now login with:');
      console.log('   Email: pricemygem@gmail.com');
      console.log('   Password: admin123');
    }

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

resetPassword();
