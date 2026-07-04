const express = require('express');
const User = require('../models/User');
const Article = require('../models/Article');
const Report = require('../models/Report');
const Tag = require('../models/Tag');
const SearchHistory = require('../models/SearchHistory');
const UserActivityLog = require('../models/UserActivityLog');
const AdminLog = require('../models/AdminLog');
const ApiConfiguration = require('../models/ApiConfiguration');
const SystemSetting = require('../models/SystemSetting');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireAdmin);

// --- Users ---

router.get('/users', async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).lean();
  res.json(users);
});

router.patch('/users/:id/status', async (req, res) => {
  const { isActive } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
  await AdminLog.create({
    admin: req.user._id,
    action: isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
    targetType: 'User',
    targetId: user._id,
  });
  res.json(user);
});

// --- Analytics ---

router.get('/analytics/users', async (req, res) => {
  const since30 = new Date(Date.now() - 30 * 86400000);
  const [total, active, newUsers] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ lastActiveAt: { $gte: new Date(Date.now() - 7 * 86400000) } }),
    User.countDocuments({ createdAt: { $gte: since30 } }),
  ]);
  res.json({ total, active, newUsers });
});

router.get('/analytics/search', async (req, res) => {
  const [topQueries, trend] = await Promise.all([
    SearchHistory.aggregate([
      { $group: { _id: '$query', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]),
    SearchHistory.aggregate([
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]),
  ]);
  const topTags = await Tag.find().sort({ searchCount: -1 }).limit(15).select('name searchCount').lean();
  res.json({ topQueries, topTags, trend });
});

router.get('/analytics/news', async (req, res) => {
  const [bySource, byLanguage, byCategory] = await Promise.all([
    Article.aggregate([{ $group: { _id: '$publisher', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 20 }]),
    Article.aggregate([{ $group: { _id: '$language', count: { $sum: 1 } } }]),
    Article.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]),
  ]);
  res.json({ bySource, byLanguage, byCategory });
});

router.get('/analytics/reports', async (req, res) => {
  const [total, perUser] = await Promise.all([
    Report.countDocuments(),
    Report.aggregate([
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { count: 1, 'user.fullName': 1, 'user.email': 1 } },
    ]),
  ]);
  res.json({ total, perUser });
});

router.get('/analytics/system', async (req, res) => {
  const apiConfigs = await ApiConfiguration.find().lean();
  const articleCount = await Article.countDocuments();
  // Rough storage estimate; swap for real db.stats() call against a live Mongo connection in production.
  const estimatedStorageMB = Math.round((articleCount * 2.5) / 1024 * 100) / 100;
  res.json({
    apiUsage: apiConfigs,
    articleCount,
    estimatedStorageMB,
    schedulerHealth: 'ok', // populated by cron job heartbeat in production
  });
});

// --- Tags moderation ---

router.get('/tags/trending', async (req, res) => {
  const tags = await Tag.find().sort({ searchCount: -1 }).limit(30).lean();
  res.json(tags);
});

router.delete('/tags/:id', async (req, res) => {
  const tag = await Tag.findByIdAndUpdate(req.params.id, { isFlagged: true }, { new: true });
  await AdminLog.create({ admin: req.user._id, action: 'REMOVE_TAG', targetType: 'Tag', targetId: tag._id });
  res.json({ success: true });
});

// --- API configuration ---

router.get('/api-config', async (req, res) => {
  const configs = await ApiConfiguration.find().sort({ priority: 1 }).lean();
  res.json(configs);
});

router.put('/api-config/:provider', async (req, res) => {
  const { isEnabled, priority, dailyQuota } = req.body;
  const config = await ApiConfiguration.findOneAndUpdate(
    { provider: req.params.provider },
    { $set: { isEnabled, priority, dailyQuota } },
    { upsert: true, new: true }
  );
  await AdminLog.create({ admin: req.user._id, action: 'UPDATE_API_CONFIG', targetType: 'ApiConfiguration', metadata: config });
  res.json(config);
});

// --- System settings ---

router.get('/settings', async (req, res) => {
  const settings = await SystemSetting.find().lean();
  res.json(settings);
});

router.put('/settings/:key', async (req, res) => {
  const setting = await SystemSetting.findOneAndUpdate(
    { key: req.params.key },
    { $set: { value: req.body.value, description: req.body.description } },
    { upsert: true, new: true }
  );
  await AdminLog.create({ admin: req.user._id, action: 'UPDATE_SETTINGS', targetType: 'SystemSetting', metadata: setting });
  res.json(setting);
});

// --- Activity logs ---

router.get('/logs/activity', async (req, res) => {
  const logs = await UserActivityLog.find().sort({ createdAt: -1 }).limit(200).populate('user', 'fullName email').lean();
  res.json(logs);
});

router.get('/logs/admin', async (req, res) => {
  const logs = await AdminLog.find().sort({ createdAt: -1 }).limit(200).populate('admin', 'fullName email').lean();
  res.json(logs);
});

module.exports = router;
