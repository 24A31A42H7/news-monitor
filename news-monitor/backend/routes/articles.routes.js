const express = require('express');
const Article = require('../models/Article');
const SavedArticle = require('../models/SavedArticle');
const BookmarkedArticle = require('../models/BookmarkedArticle');
const UserActivityLog = require('../models/UserActivityLog');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const DEFAULT_CATEGORIES = [
  'Steel', 'Coal', 'Iron Ore', 'RINL', 'Vizag Steel',
  'Manufacturing', 'Mining', 'Government Policies', 'Exports', 'Imports',
];

// GET /api/articles/dashboard - today's news across default categories
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setDate(startOfDay.getDate() - 1);
    const categoryParam = req.query.category;
    const categories = categoryParam ? [categoryParam] : DEFAULT_CATEGORIES;

    // Category here maps loosely to tag/category name match on title/description
    const orClauses = categories.map((c) => ({
      $or: [{ title: new RegExp(c, 'i') }, { description: new RegExp(c, 'i') }],
    }));

    const articles = await Article.find({
      publishedDate: { $gte: startOfDay },
      $or: orClauses.flatMap((c) => c.$or),
    })
      .sort({ relevanceScore: -1, publishedDate: -1 })
      .limit(parseInt(req.query.limit, 10) || 50)
      .lean();

    res.json({ categories, count: articles.length, articles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/articles/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id).populate('tags category').lean();
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/articles/:id/bookmark
router.post('/:id/bookmark', requireAuth, async (req, res) => {
  try {
    const existing = await BookmarkedArticle.findOne({ user: req.user._id, article: req.params.id });
    if (existing) {
      await existing.deleteOne();
      return res.json({ bookmarked: false });
    }
    await BookmarkedArticle.create({ user: req.user._id, article: req.params.id });
    await UserActivityLog.create({ user: req.user._id, action: 'BOOKMARK', metadata: { articleId: req.params.id } });
    res.json({ bookmarked: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/articles/:id/save
router.post('/:id/save', requireAuth, async (req, res) => {
  try {
    const existing = await SavedArticle.findOne({ user: req.user._id, article: req.params.id });
    if (existing) {
      await existing.deleteOne();
      return res.json({ saved: false });
    }
    await SavedArticle.create({ user: req.user._id, article: req.params.id });
    res.json({ saved: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/articles/me/bookmarks
router.get('/me/bookmarks', requireAuth, async (req, res) => {
  const bookmarks = await BookmarkedArticle.find({ user: req.user._id }).populate('article').lean();
  res.json(bookmarks.map((b) => b.article));
});

// GET /api/articles/me/saved
router.get('/me/saved', requireAuth, async (req, res) => {
  const saved = await SavedArticle.find({ user: req.user._id }).populate('article').lean();
  res.json(saved.map((s) => s.article));
});

module.exports = router;
