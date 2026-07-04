const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    profilePicture: { type: String },
    authProvider: { type: String, default: 'google' },
    role: { type: String, enum: ['admin', 'user'], default: 'user', index: true },
    isActive: { type: Boolean, default: true },
    favoriteTags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
    customCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    lastLoginAt: { type: Date },
    lastActiveAt: { type: Date },
    refreshTokenHash: { type: String, select: false },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, isActive: 1 });

module.exports = mongoose.model('User', userSchema);
