const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    content: { type: String },
    publisher: { type: String, required: true, index: true },
    publisherLogo: { type: String },
    author: { type: String },
    url: { type: String, required: true },
    urlHash: { type: String, required: true, unique: true, index: true }, // sha256(url) for dedup
    titleNormalizedHash: { type: String, index: true }, // for similar-title matching
    imageUrl: { type: String },
    thumbnail: { type: String },
    language: { type: String, enum: ['en', 'te', 'hi'], default: 'en', index: true },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag', index: true }],
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true },
    country: { type: String, default: 'India', index: true },
    edition: {
      type: String,
      enum: ['National', 'Andhra Pradesh', 'Telangana', 'Business Edition', 'International Edition'],
      default: 'National',
    },
    source: { type: String, index: true }, // which provider API returned it: newsapi/gnews/etc.
    relevanceScore: { type: Number, default: 0 },
    trustedPublisher: { type: Boolean, default: false },
    publishedDate: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

// Text index for full-text / fuzzy-ish search across title, description, content
articleSchema.index({ title: 'text', description: 'text', content: 'text' });
articleSchema.index({ publishedDate: -1 });
articleSchema.index({ language: 1, category: 1, publishedDate: -1 });

module.exports = mongoose.model('Article', articleSchema);
