// src/models/task.js
module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define('Task', {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    lsrwComponent: {
      type: DataTypes.ENUM('LISTENING', 'SPEAKING', 'READING', 'WRITING'),
      allowNull: false,
      field: 'type',
    },
    assessmentType: { type: DataTypes.STRING, field: 'subType' },
    difficultyLevel: {
      type: DataTypes.ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED'),
      defaultValue: 'INTERMEDIATE',
      field: 'difficulty',
    },
    category: {
      type: DataTypes.ENUM('PRACTICE', 'ASSESSMENT'),
      defaultValue: 'PRACTICE',
    },
    priority: {
      type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'),
      defaultValue: 'MEDIUM',
    },
    instructions: { type: DataTypes.TEXT },
    imageUrl: { type: DataTypes.TEXT },
    timeLimit: { type: DataTypes.INTEGER, comment: 'Time limit in seconds' },
    maxAttempts: { type: DataTypes.INTEGER, defaultValue: 1 },
    passingScore: { type: DataTypes.FLOAT },
    startDate: { type: DataTypes.DATE },
    endDate: { type: DataTypes.DATE },
    passage: { type: DataTypes.TEXT },
    audioUrl: { type: DataTypes.STRING },
    status: {
      type: DataTypes.ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED'),
      defaultValue: 'DRAFT',
      get() {
        const rawValue = this.getDataValue('status');
        if (rawValue === 'PUBLISHED') return 'Published';
        if (rawValue === 'DRAFT') return 'Draft';
        if (rawValue === 'ARCHIVED') return 'Archived';
        return rawValue;
      },
      set(val) {
        if (val === 'Published') {
          this.setDataValue('status', 'PUBLISHED');
        } else if (val === 'Draft') {
          this.setDataValue('status', 'DRAFT');
        } else if (val === 'Archived') {
          this.setDataValue('status', 'ARCHIVED');
        } else {
          this.setDataValue('status', val ? val.toUpperCase() : 'DRAFT');
        }
      }
    },
    visibilityScope: {
      type: DataTypes.ENUM('GLOBAL', 'ORGANIZATION', 'DEPARTMENT', 'GROUP'),
      defaultValue: 'GLOBAL',
      get() {
        const rawValue = this.getDataValue('visibilityScope');
        if (rawValue === 'GLOBAL') return 'Global';
        if (rawValue === 'GROUP') return 'GroupSpecific';
        return rawValue;
      },
      set(val) {
        if (val === 'GroupSpecific' || val === 'GROUP') {
          this.setDataValue('visibilityScope', 'GROUP');
        } else if (val === 'Global' || val === 'GLOBAL') {
          this.setDataValue('visibilityScope', 'GLOBAL');
        } else {
          this.setDataValue('visibilityScope', val || 'GLOBAL');
        }
      }
    },
    questions: {
      type: DataTypes.JSON,
      comment: 'Array of question objects for assessment',
    },
    // Foreign key to creator (admin or staff)
    creatorId: { type: DataTypes.CHAR(36), allowNull: false, field: 'createdById' },
  }, {
    tableName: 'tasks',
    timestamps: true,
  });

  // Associations defined later in index.js if needed
  return Task;
};
