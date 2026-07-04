const mongoose = require('mongoose');

const userActivityLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true }, // e.g. LOGIN, SEARCH, BOOKMARK, GENERATE_PDF
    metadata: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

userActivityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('UserActivityLog', userActivityLogSchema);
