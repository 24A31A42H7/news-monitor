const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isCustom: { type: Boolean, default: true },
    usageCount: { type: Number, default: 0 },
    searchCount: { type: Number, default: 0 },
    isFlagged: { type: Boolean, default: false }, // admin can flag/remove inappropriate tags
  },
  { timestamps: true }
);

tagSchema.index({ usageCount: -1 });
tagSchema.index({ searchCount: -1 });

module.exports = mongoose.model('Tag', tagSchema);
