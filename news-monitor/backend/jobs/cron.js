const cron = require('node-cron');
const Article = require('../models/Article');
const ApiConfiguration = require('../models/ApiConfiguration');
const { fetchAndStore } = require('../services/newsAggregator');

const DEFAULT_QUERIES = [
  'steel', 'coal', 'iron ore', 'RINL', 'Vizag Steel', 'manufacturing', 'mining',
  'government policies industry', 'exports India', 'imports India', 'logistics',
  'infrastructure', 'energy', 'commodity prices', 'industrial production',
  'global steel market', 'shipping', 'ports', 'environmental policies',
];

/**
 * Runs every morning at 6:00 AM server time — pulls fresh articles for every
 * default tracked query across all configured providers.
 */
function scheduleNewsFetch() {
  cron.schedule(
  '0 6 * * *',
  async () => {
    console.log('[cron] Starting scheduled news fetch...');

    let totalFetched = 0;

    for (const query of DEFAULT_QUERIES) {
      try {
        const count = await fetchAndStore(query, {
          language: 'en',
          limit: 20,
        });

        totalFetched += count;
      } catch (err) {
        console.error(`[cron] Failed fetching "${query}":`, err.message);
      }
    }

    console.log(
      `[cron] Scheduled news fetch complete. ~${totalFetched} articles processed.`
    );
  },
  {
    timezone: 'Asia/Kolkata',
  }
);

console.log(
  '[cron] News fetch job scheduled for 6.00 AM IST daily.'
);
}

/**
 * Runs daily at 2:00 AM — deletes articles older than ARTICLE_RETENTION_DAYS (default 3 years),
 * and resets each provider's daily usage counter.
 */
function scheduleRetentionCleanup() {
  cron.schedule('0 2 * * *', async () => {
    const retentionDays = parseInt(process.env.ARTICLE_RETENTION_DAYS, 10) || 1095;
    const cutoff = new Date(Date.now() - retentionDays * 86400000);
    try {
      const result = await Article.deleteMany({ publishedDate: { $lt: cutoff } });
      console.log(`[cron] Retention cleanup removed ${result.deletedCount} article(s) older than ${retentionDays} days.`);
    } catch (err) {
      console.error('[cron] Retention cleanup failed:', err.message);
    }
  });

  // Reset provider daily usage counters at midnight
  cron.schedule('30 11 * * *', async () => {
    await ApiConfiguration.updateMany({}, { $set: { usedToday: 0, lastResetAt: new Date() } }).catch(() => {});
    console.log('[cron] API provider daily usage counters reset.');
  });

  console.log('[cron] Retention cleanup job scheduled for 02:00 daily.');
}

function initCronJobs() {
  scheduleNewsFetch();
  scheduleRetentionCleanup();
}

module.exports = { initCronJobs, DEFAULT_QUERIES };
