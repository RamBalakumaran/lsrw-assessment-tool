// src/models/response.js
module.exports = (sequelize, DataTypes) => {
  const Response = sequelize.define('Response', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // The user who submitted the response
    userId: { type: DataTypes.UUID, allowNull: false },
    // The task (assessment) this response belongs to
    taskId: { type: DataTypes.UUID, allowNull: false },
    // Raw answer payload (could be text, audio path, etc.)
    answer: { type: DataTypes.TEXT },
    // Score given by AI evaluation
    score: { type: DataTypes.FLOAT },
    // Optional feedback from AI
    feedback: { type: DataTypes.TEXT },
    // Timestamp of submission
    submittedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'responses',
    timestamps: false,
  });

  // Associations can be defined in models/index.js if needed
  return Response;
};
