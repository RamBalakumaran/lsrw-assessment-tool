const db = require('./models');
const bcrypt = require('bcryptjs');

const seedUsers = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Database connected.');

    // Wait for tables to sync
    await db.sequelize.sync({ force: true });

    const passwordHash = await bcrypt.hash('123456', 10);

    const users = [
      { firstName: 'Super', lastName: 'Admin', email: 'admin@nec.edu.in', role: 'ADMIN', passwordHash, status: 'ACTIVE', forcePasswordReset: false },
      { firstName: 'John', lastName: 'Doe', email: 'teacher@nec.edu.in', role: 'TEACHER', passwordHash, status: 'ACTIVE', forcePasswordReset: false },
      { firstName: 'Alice', lastName: 'Johnson', email: 'teacher2@nec.edu.in', role: 'TEACHER', passwordHash, status: 'ACTIVE', forcePasswordReset: false },
      { firstName: 'Test', lastName: 'Student 1', email: 'student@nec.edu.in', role: 'STUDENT', passwordHash, status: 'ACTIVE', forcePasswordReset: false },
      { firstName: 'Test', lastName: 'Student 2', email: 'student2@nec.edu.in', role: 'STUDENT', passwordHash, status: 'ACTIVE', forcePasswordReset: false }
    ];

    const createdUsers = {};
    for (const user of users) {
      let record = await db.User.findOne({ where: { email: user.email } });
      if (!record) {
        record = await db.User.create(user);
        console.log(`Created user: ${user.email}`);
      }
      createdUsers[user.email] = record;
    }

    // Seed Groups
    const csGroup = await db.Group.create({ name: 'Computer Science' });
    const mechGroup = await db.Group.create({ name: 'Mechanical' });

    // Assign Admins
    await csGroup.addAdmin(createdUsers['teacher@nec.edu.in']);
    await mechGroup.addAdmin(createdUsers['teacher2@nec.edu.in']);

    // Assign Members
    await csGroup.addMember(createdUsers['student@nec.edu.in']);
    await mechGroup.addMember(createdUsers['student2@nec.edu.in']);

    console.log('Seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedUsers();
