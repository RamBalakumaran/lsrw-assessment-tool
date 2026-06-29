module.exports = (sequelize, DataTypes) => {
  const ReadingResponse = sequelize.define('ReadingResponse', {
    responseId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, field: 'response_id' },
    attemptId: { type: DataTypes.UUID, allowNull: false, field: 'attempt_id' },
    questionId: { type: DataTypes.UUID, allowNull: false, field: 'question_id' },
    userId: { type: DataTypes.STRING, field: 'user_id' },
    tenantId: { type: DataTypes.STRING, allowNull: false, field: 'tenant_id' },
    selectedAnswer: { type: DataTypes.TEXT, field: 'selected_answer' },
    isCorrect: { type: DataTypes.BOOLEAN, field: 'is_correct' },
    marksObtained: { type: DataTypes.FLOAT, field: 'marks_obtained' },
    responseTimestamp: { type: DataTypes.DATE, field: 'response_timestamp' }
  }, {
    tableName: 'reading_responses',
    timestamps: false
  });

  return ReadingResponse;
};
