const mongoose = require('mongoose');

const reportArticleSchema = new mongoose.Schema(
  {
    report: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true, index: true },
    article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ReportArticle', reportArticleSchema);
