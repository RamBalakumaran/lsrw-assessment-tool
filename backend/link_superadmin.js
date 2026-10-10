const db = require('./src/models');

async function linkSuperAdmins() {
  try {
    const superAdmins = await db.User.findAll({ where: { role: 'SUPER_ADMIN' } });
    const groups = await db.Group.findAll();
    
    if (superAdmins.length > 0 && groups.length > 0) {
      console.log(`Linking ${superAdmins.length} super admins to ${groups.length} groups...`);
      for (const group of groups) {
        await group.addAdmins(superAdmins);
      }
      console.log('Successfully linked super admins to all groups.');
    } else {
      console.log('No super admins or groups found.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

linkSuperAdmins();
