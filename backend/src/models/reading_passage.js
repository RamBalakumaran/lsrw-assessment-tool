module.exports = (sequelize, DataTypes) => {
  const ReadingPassage = sequelize.define('ReadingPassage', {
    passageId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'passage_id'
    },
    tenantId: { type: DataTypes.STRING, allowNull: false, field: 'tenant_id', index: true },
    title: { type: DataTypes.STRING(255) },
    content: { type: DataTypes.TEXT, allowNull: false },
    difficultyLevel: { type: DataTypes.ENUM('EASY','MEDIUM','HARD'), field: 'difficulty_level' },
    wordCount: { type: DataTypes.INTEGER, field: 'word_count' },
    topic: { type: DataTypes.STRING(255) },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
    createdBy: { type: DataTypes.STRING, field: 'created_by' },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' }
  }, {
    tableName: 'reading_passages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return ReadingPassage;
};
