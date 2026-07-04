const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    query: { type: String, required: true },
    filters: { type: mongoose.Schema.Types.Mixed },
    resultCount: { type: Number, default: 0 },
    language: { type: String },
  },
  { timestamps: true }
);

searchHistorySchema.index({ query: 'text' });
searchHistorySchema.index({ createdAt: -1 });

module.exports = mongoose.model('SearchHistory', searchHistorySchema);
