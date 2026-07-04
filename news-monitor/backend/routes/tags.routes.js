const express = require('express');
const Tag = require('../models/Tag');
const Category = require('../models/Category');
const User = require('../models/User');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// GET /api/tags
router.get('/', requireAuth, async (req, res) => {
  const tags = await Tag.find({ isFlagged: false }).sort({ usageCount: -1 }).lean();
  res.json(tags);
});

// GET /api/tags/trending
router.get('/trending', requireAuth, async (req, res) => {
  const tags = await Tag.find({ isFlagged: false }).sort({ searchCount: -1 }).limit(20).lean();
  res.json(tags);
});

// POST /api/tags — create custom tag
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });
    const slug = slugify(name);
    let tag = await Tag.findOne({ slug });
    if (!tag) {
      tag = await Tag.create({ name: name.trim(), slug, createdBy: req.user._id, isCustom: true });
    }
    await User.updateOne({ _id: req.user._id }, { $addToSet: { favoriteTags: tag._id } });
    res.status(201).json(tag);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tags/:id — edit custom tag (owner or admin only)
router.put('/:id', requireAuth, async (req, res) => {
  const tag = await Tag.findById(req.params.id);
  if (!tag) return res.status(404).json({ error: 'Tag not found' });
  if (String(tag.createdBy) !== String(req.user._id) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized to edit this tag' });
  }
  if (req.body.name) {
    tag.name = req.body.name.trim();
    tag.slug = slugify(req.body.name);
  }
  await tag.save();
  res.json(tag);
});

// DELETE /api/tags/:id — remove own custom tag (unfavorite) or admin removal
router.delete('/:id', requireAuth, async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $pull: { favoriteTags: req.params.id } });
  if (req.user.role === 'admin') {
    // Admin can hard-flag/remove a tag system-wide
    await Tag.findByIdAndUpdate(req.params.id, { isFlagged: true });
  }
  res.json({ success: true });
});

// --- Categories ---

// GET /api/tags/categories
router.get('/categories/all', requireAuth, async (req, res) => {
  const categories = await Category.find().lean();
  res.json(categories);
});

// POST /api/tags/categories
router.post('/categories/create', requireAuth, async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const slug = slugify(name);
  const category = await Category.findOneAndUpdate(
    { slug },
    { $setOnInsert: { name, slug, description, createdBy: req.user._id } },
    { upsert: true, new: true }
  );
  await User.updateOne({ _id: req.user._id }, { $addToSet: { customCategories: category._id } });
  res.status(201).json(category);
});

module.exports = router;
