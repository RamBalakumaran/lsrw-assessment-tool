// src/models/response.js
module.exports = (sequelize, DataTypes) => {
  const Response = sequelize.define('Response', {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // The user who submitted the response
    userId: { type: DataTypes.CHAR(36), allowNull: false },
    // The task (assessment) this response belongs to
    taskId: { type: DataTypes.CHAR(36), allowNull: false },
    // Raw answer payload (could be text, audio path, etc.)
    answer: { type: DataTypes.TEXT },
    // Score given by AI evaluation
    score: { type: DataTypes.FLOAT },
    // Optional feedback from AI
    feedback: { type: DataTypes.TEXT },
    studentAnswers: { type: DataTypes.JSON },
    aiResults: { type: DataTypes.JSON },
    status: { type: DataTypes.STRING, defaultValue: 'COMPLETED' },
    teacherFeedback: { type: DataTypes.TEXT },
    manualScore: { type: DataTypes.FLOAT },
    recordingUrl: { type: DataTypes.STRING },
    // Timestamp of submission
    submittedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'responses',
    timestamps: false,
  });

  // Associations can be defined in models/index.js if needed
  return Response;
};
