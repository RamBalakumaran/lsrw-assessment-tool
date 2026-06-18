// src/models/task.js
module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define('Task', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    lsrwComponent: {
      type: DataTypes.ENUM('Listening', 'Speaking', 'Reading', 'Writing'),
      allowNull: false,
    },
    assessmentType: { type: DataTypes.STRING },
    difficultyLevel: {
      type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced'),
      defaultValue: 'Beginner',
    },
    instructions: { type: DataTypes.TEXT },
    timeLimit: { type: DataTypes.INTEGER, comment: 'Time limit in seconds' },
    maxAttempts: { type: DataTypes.INTEGER, defaultValue: 1 },
    passingScore: { type: DataTypes.FLOAT },
    startDate: { type: DataTypes.DATE },
    endDate: { type: DataTypes.DATE },
    status: {
      type: DataTypes.ENUM('Draft', 'Published', 'Archived'),
      defaultValue: 'Draft',
    },
    visibilityScope: {
      type: DataTypes.ENUM('Global', 'GroupSpecific'),
      defaultValue: 'Global',
    },
    questions: {
      type: DataTypes.JSON,
      comment: 'Array of question objects for assessment',
    },
    // Foreign key to creator (admin or staff)
    creatorId: { type: DataTypes.UUID, allowNull: false },
  }, {
    tableName: 'tasks',
    timestamps: true,
  });

  // Associations defined later in index.js if needed
  return Task;
};
