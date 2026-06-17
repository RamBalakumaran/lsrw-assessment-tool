// src/models/user.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('ADMIN', 'TEACHER', 'STUDENT'), allowNull: false },
    status: { type: DataTypes.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' },
    forcePasswordReset: { type: DataTypes.BOOLEAN, defaultValue: true },
    assignedTeacherId: { type: DataTypes.UUID, allowNull: true },
  }, {
    tableName: 'users',
    timestamps: true,
  });

  // Associations are defined in src/models/index.js
  return User;
};
