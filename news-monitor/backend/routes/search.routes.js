const express = require('express');
const Article = require('../models/Article');
const Tag = require('../models/Tag');
const SearchHistory = require('../models/SearchHistory');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * Related-keyword expansion table. In production this could be a DB-managed
 * synonym collection or a call to an NLP service; kept in-memory here so it
 * works with zero external dependencies.
 */
const RELATED_KEYWORDS = {
  coal: ['coking coal', 'thermal coal', 'coal imports', 'coal prices'],
  steel: ['steel prices', 'green steel', 'crude steel', 'steel exports'],
  iron: ['iron ore', 'iron ore imports', 'iron ore prices'],
};

// Minimal cross-language keyword map so a Telugu/Hindi search also surfaces
// English-language articles on the same topic (and vice versa).
const CROSS_LANGUAGE_MAP = {
  // Telugu
  'ఉక్కు': ['steel'], 'బొగ్గు': ['coal'], 'ఇనుము': ['iron', 'iron ore'],
  // Hindi
  'इस्पात': ['steel'], 'कोयला': ['coal'], 'लोहा': ['iron', 'iron ore'],
};

function expandQuery(query) {
  const lower = query.toLowerCase().trim();
  const expansions = new Set([query]);
  if (RELATED_KEYWORDS[lower]) RELATED_KEYWORDS[lower].forEach((k) => expansions.add(k));
  if (CROSS_LANGUAGE_MAP[query]) CROSS_LANGUAGE_MAP[query].forEach((k) => expansions.add(k));
  return Array.from(expansions);
}

// GET /api/search/suggestions?q=
router.get('/suggestions', requireAuth, async (req, res) => {
  const q = req.query.q || '';
  if (q.length < 2) return res.json([]);
  const [tagMatches, titleMatches] = await Promise.all([
    Tag.find({ name: new RegExp(q, 'i') }).limit(5).lean(),
    Article.find({ title: new RegExp(q, 'i') }).select('title').limit(5).lean(),
  ]);
  res.json({
    tags: tagMatches.map((t) => t.name),
    titles: titleMatches.map((a) => a.title),
    related: expandQuery(q).filter((k) => k.toLowerCase() !== q.toLowerCase()),
  });
});

// POST /api/search — main search endpoint, only executed on explicit "Search" click
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      query = '',
      languages = [],       // ['en','te','hi']
      editions = [],
      publishers = [],
      countries = [],
      tags = [],
      categories = [],
      fromDate,
      toDate,
      page = 1,
      limit = 20,
    } = req.body;

    const filter = {};

    if (query && query.trim()) {
      const expanded = expandQuery(query.trim());
      filter.$or = expanded.map((term) => ({ $text: { $search: term } }))
        .concat(expanded.map((term) => ({ title: new RegExp(term, 'i') })))
        .concat(expanded.map((term) => ({ description: new RegExp(term, 'i') })));
    }

    if (languages.length) filter.language = { $in: languages };
    if (editions.length) filter.edition = { $in: editions };
    if (publishers.length) filter.publisher = { $in: publishers };
    if (countries.length) filter.country = { $in: countries };
    if (tags.length) filter.tags = { $in: tags };
    if (categories.length) filter.category = { $in: categories };

    if (fromDate || toDate) {
      filter.publishedDate = {};
      if (fromDate) filter.publishedDate.$gte = new Date(fromDate);
      if (toDate) filter.publishedDate.$lte = new Date(toDate);
    }

    const skip = (Math.max(1, page) - 1) * limit;
    const [results, total] = await Promise.all([
      Article.find(filter).sort({ relevanceScore: -1, publishedDate: -1 }).skip(skip).limit(limit).lean(),
      Article.countDocuments(filter),
    ]);

    // Log search history + bump tag search counts (non-blocking)
    SearchHistory.create({
      user: req.user._id,
      query,
      filters: { languages, editions, publishers, countries, tags, categories, fromDate, toDate },
      resultCount: total,
      language: languages[0],
    }).catch(() => {});
    if (tags.length) Tag.updateMany({ _id: { $in: tags } }, { $inc: { searchCount: 1 } }).catch(() => {});

    res.json({ total, page: Number(page), limit: Number(limit), results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/search/history
router.get('/history/me', requireAuth, async (req, res) => {
  const history = await SearchHistory.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50).lean();
  res.json(history);
});

module.exports = router;
