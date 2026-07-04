const mongoose = require('mongoose');

const bookmarkedArticleSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
  },
  { timestamps: true }
);

bookmarkedArticleSchema.index({ user: 1, article: 1 }, { unique: true });

module.exports = mongoose.model('BookmarkedArticle', bookmarkedArticleSchema);
