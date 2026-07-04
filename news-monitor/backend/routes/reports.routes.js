const express = require('express');
const path = require('path');
const Article = require('../models/Article');
const Report = require('../models/Report');
const ReportArticle = require('../models/ReportArticle');
const UserActivityLog = require('../models/UserActivityLog');
const { generateReportPdf } = require('../services/pdfGenerator');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/reports/generate  body: { articleIds: [...], title }
router.post('/generate', requireAuth, async (req, res) => {
  try {
    const { articleIds, title } = req.body;
    if (!Array.isArray(articleIds) || !articleIds.length) {
      return res.status(400).json({ error: 'articleIds must be a non-empty array' });
    }

    const articles = await Article.find({ _id: { $in: articleIds } }).lean();
    // Preserve the order the user selected them in
    const ordered = articleIds.map((id) => articles.find((a) => String(a._id) === String(id))).filter(Boolean);

    const { filePath, fileName, fileSize } = await generateReportPdf({
      articles: ordered,
      generatedBy: req.user.fullName,
      orgName: 'News Monitoring System',
      title,
    });

    const report = await Report.create({
      user: req.user._id,
      title: title || 'Industry News Report',
      filePath: `/uploads/reports/${fileName}`,
      fileSize,
      articleCount: ordered.length,
    });

    await ReportArticle.insertMany(
      ordered.map((a, idx) => ({ report: report._id, article: a._id, order: idx }))
    );

    await UserActivityLog.create({
      user: req.user._id,
      action: 'GENERATE_PDF',
      metadata: { reportId: report._id, articleCount: ordered.length },
    });

    res.status(201).json({ report, downloadUrl: report.filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/me — report history
router.get('/me', requireAuth, async (req, res) => {
  const reports = await Report.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json(reports);
});

module.exports = router;
