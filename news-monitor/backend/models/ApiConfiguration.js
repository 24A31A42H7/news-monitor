const mongoose = require('mongoose');

const apiConfigurationSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
      unique: true,
      enum: ['newsapi', 'gnews', 'newsdata', 'mediastack', 'currents', 'bingnews', 'eventregistry'],
    },
    isEnabled: { type: Boolean, default: true },
    priority: { type: Number, default: 0 }, // lower = tried first
    dailyQuota: { type: Number, default: 0 },
    usedToday: { type: Number, default: 0 },
    lastResetAt: { type: Date, default: Date.now },
    lastError: { type: String },
    lastUsedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ApiConfiguration', apiConfigurationSchema);
