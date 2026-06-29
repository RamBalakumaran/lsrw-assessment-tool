module.exports = (sequelize, DataTypes) => {
  const TenantConfig = sequelize.define('TenantConfig', {
    tenantId: { type: DataTypes.STRING, primaryKey: true, field: 'tenant_id' },
    readingThresholds: { type: DataTypes.JSON, field: 'reading_thresholds', defaultValue: { comprehension: 0.6, vocabulary: 0.6, grammar: 0.6, discourse: 0.6 } },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' }
  }, {
    tableName: 'tenant_configs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return TenantConfig;
};
