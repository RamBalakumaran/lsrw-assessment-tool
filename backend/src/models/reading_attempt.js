module.exports = (sequelize, DataTypes) => {
  const ReadingAttempt = sequelize.define('ReadingAttempt', {
    attemptId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, field: 'attempt_id' },
    tenantId: { type: DataTypes.STRING, allowNull: false, field: 'tenant_id', index: true },
    userId: { type: DataTypes.STRING, allowNull: false, field: 'user_id' },
    assessmentId: { type: DataTypes.STRING, field: 'assessment_id' },
    passageId: { type: DataTypes.UUID, field: 'passage_id' },
    evaluationPath: { type: DataTypes.STRING(20), defaultValue: 'OBJECTIVE', field: 'evaluation_path' },
    modality: { type: DataTypes.STRING(20), defaultValue: 'READING' },
    startTime: { type: DataTypes.DATE, field: 'start_time' },
    endTime: { type: DataTypes.DATE, field: 'end_time' },
    timeSpentSeconds: { type: DataTypes.INTEGER, field: 'time_spent_seconds' },
    wordsPerMinute: { type: DataTypes.FLOAT, field: 'words_per_minute' },
    totalQuestions: { type: DataTypes.INTEGER, field: 'total_questions' },
    correctAnswers: { type: DataTypes.INTEGER, field: 'correct_answers' },
    accuracyRate: { type: DataTypes.FLOAT, field: 'accuracy_rate' },
    comprehensionScore: { type: DataTypes.FLOAT, field: 'comprehension_score' },
    vocabularyScore: { type: DataTypes.FLOAT, field: 'vocabulary_score' },
    grammarScore: { type: DataTypes.FLOAT, field: 'grammar_score' },
    discourseCoherenceScore: { type: DataTypes.FLOAT, field: 'discourse_coherence_score' },
    overallReadingScore: { type: DataTypes.FLOAT, field: 'overall_reading_score' },
    parameterVector: { type: DataTypes.JSON, field: 'parameter_vector' },
    reliabilitySignal: { type: DataTypes.FLOAT, defaultValue: 1.0, field: 'reliability_signal' },
    feedbackGenerated: { type: DataTypes.JSON, field: 'feedback_generated' },
    evaluationTimestamp: { type: DataTypes.DATE, field: 'evaluation_timestamp' },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' }
  }, {
    tableName: 'reading_attempts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return ReadingAttempt;
};
