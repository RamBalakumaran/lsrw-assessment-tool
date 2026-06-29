module.exports = (sequelize, DataTypes) => {
  const ReadingQuestion = sequelize.define('ReadingQuestion', {
    questionId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, field: 'question_id' },
    passageId: { type: DataTypes.UUID, allowNull: false, field: 'passage_id' },
    tenantId: { type: DataTypes.STRING, allowNull: false, field: 'tenant_id', index: true },
    questionText: { type: DataTypes.TEXT, allowNull: false, field: 'question_text' },
    questionType: { type: DataTypes.ENUM('MCQ','TRUE_FALSE','FILL_BLANK','SHORT_ANSWER'), field: 'question_type' },
    options: { type: DataTypes.JSON, allowNull: true },
    correctAnswer: { type: DataTypes.STRING(500), allowNull: false, field: 'correct_answer' },
    marks: { type: DataTypes.FLOAT, defaultValue: 1.0 },
    competencyAxis: { type: DataTypes.ENUM('LEXICAL','GRAMMATICAL','COMPREHENSION','DISCOURSE_COHERENCE'), field: 'competency_axis' },
    questionOrder: { type: DataTypes.INTEGER, field: 'question_order' },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
    createdAt: { type: DataTypes.DATE, field: 'created_at' }
  }, {
    tableName: 'reading_questions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return ReadingQuestion;
};
