const axios = require('axios');
const crypto = require('crypto');
const Article = require('../models/Article');
const ApiConfiguration = require('../models/ApiConfiguration');

const TRUSTED_PUBLISHERS = new Set([
  'The Hindu', 'Times of India', 'Indian Express', 'Hindustan Times', 'Economic Times',
  'Mint', 'Business Standard', 'Financial Express', 'Deccan Herald',
  'Reuters', 'Bloomberg', 'BBC', 'CNBC', 'Financial Times', 'Wall Street Journal',
  'Associated Press', 'Al Jazeera', 'Nikkei Asia',
]);

/**
 * Each provider adapter takes (query, options) and returns a normalized array of:
 * { title, description, content, publisher, author, url, imageUrl, language, publishedDate, source }
 * Wrapped in try/catch so one provider failing never breaks the whole aggregation.
 */
const PROVIDERS = {
  newsapi: async (query, opts) => {
    const key = process.env.NEWSAPI_KEY;
    if (!key) throw new Error('NEWSAPI_KEY not configured');
    const { data } = await axios.get('https://newsapi.org/v2/everything', {
      params: { q: query, language: opts.language === 'en' ? 'en' : undefined, apiKey: key, pageSize: opts.limit || 20 },
      timeout: 8000,
    });
    return (data.articles || []).map((a) => ({
      title: a.title,
      description: a.description,
      content: a.content,
      publisher: a.source?.name || 'Unknown',
      author: a.author,
      url: a.url,
      imageUrl: a.urlToImage,
      language: opts.language || 'en',
      publishedDate: a.publishedAt ? new Date(a.publishedAt) : new Date(),
      source: 'newsapi',
    }));
  },

  gnews: async (query, opts) => {
    const key = process.env.GNEWS_KEY;
    if (!key) throw new Error('GNEWS_KEY not configured');
    const { data } = await axios.get('https://gnews.io/api/v4/search', {
      params: { q: query, lang: opts.language || 'en', token: key, max: opts.limit || 20 },
      timeout: 8000,
    });
    return (data.articles || []).map((a) => ({
      title: a.title,
      description: a.description,
      content: a.content,
      publisher: a.source?.name || 'Unknown',
      author: null,
      url: a.url,
      imageUrl: a.image,
      language: opts.language || 'en',
      publishedDate: a.publishedAt ? new Date(a.publishedAt) : new Date(),
      source: 'gnews',
    }));
  },

  newsdata: async (query, opts) => {
    const key = process.env.NEWSDATA_KEY;
    if (!key) throw new Error('NEWSDATA_KEY not configured');
    const { data } = await axios.get('https://newsdata.io/api/1/news', {
      params: { q: query, language: opts.language || 'en', apikey: key },
      timeout: 8000,
    });
    return (data.results || []).map((a) => ({
      title: a.title,
      description: a.description,
      content: a.content,
      publisher: a.source_id || 'Unknown',
      author: (a.creator && a.creator[0]) || null,
      url: a.link,
      imageUrl: a.image_url,
      language: opts.language || 'en',
      publishedDate: a.pubDate ? new Date(a.pubDate) : new Date(),
      source: 'newsdata',
    }));
  },

  mediastack: async (query, opts) => {
    const key = process.env.MEDIASTACK_KEY;
    if (!key) throw new Error('MEDIASTACK_KEY not configured');
    const { data } = await axios.get('http://api.mediastack.com/v1/news', {
      params: { access_key: key, keywords: query, languages: opts.language || 'en', limit: opts.limit || 20 },
      timeout: 8000,
    });
    return (data.data || []).map((a) => ({
      title: a.title,
      description: a.description,
      content: a.description,
      publisher: a.source || 'Unknown',
      author: a.author,
      url: a.url,
      imageUrl: a.image,
      language: opts.language || 'en',
      publishedDate: a.published_at ? new Date(a.published_at) : new Date(),
      source: 'mediastack',
    }));
  },

  currents: async (query, opts) => {
    const key = process.env.CURRENTS_KEY;
    if (!key) throw new Error('CURRENTS_KEY not configured');
    const { data } = await axios.get('https://api.currentsapi.services/v1/search', {
      params: { keywords: query, language: opts.language || 'en', apiKey: key },
      timeout: 8000,
    });
    return (data.news || []).map((a) => ({
      title: a.title,
      description: a.description,
      content: a.description,
      publisher: a.author || 'Unknown',
      author: a.author,
      url: a.url,
      imageUrl: a.image,
      language: opts.language || 'en',
      publishedDate: a.published ? new Date(a.published) : new Date(),
      source: 'currents',
    }));
  },

  bingnews: async (query, opts) => {
    const key = process.env.BING_NEWS_KEY;
    if (!key) throw new Error('BING_NEWS_KEY not configured');
    const { data } = await axios.get('https://api.bing.microsoft.com/v7.0/news/search', {
      params: { q: query, count: opts.limit || 20 },
      headers: { 'Ocp-Apim-Subscription-Key': key },
      timeout: 8000,
    });
    return (data.value || []).map((a) => ({
      title: a.name,
      description: a.description,
      content: a.description,
      publisher: a.provider?.[0]?.name || 'Unknown',
      author: null,
      url: a.url,
      imageUrl: a.image?.thumbnail?.contentUrl,
      language: opts.language || 'en',
      publishedDate: a.datePublished ? new Date(a.datePublished) : new Date(),
      source: 'bingnews',
    }));
  },

  eventregistry: async (query, opts) => {
    const key = process.env.EVENTREGISTRY_KEY;
    if (!key) throw new Error('EVENTREGISTRY_KEY not configured');
    const { data } = await axios.post('https://eventregistry.org/api/v1/article/getArticles', {
      keyword: query,
      apiKey: key,
      lang: opts.language || 'eng',
      articlesCount: opts.limit || 20,
    }, { timeout: 8000 });
    const results = data?.articles?.results || [];
    return results.map((a) => ({
      title: a.title,
      description: a.body?.slice(0, 300),
      content: a.body,
      publisher: a.source?.title || 'Unknown',
      author: (a.authors && a.authors[0]?.name) || null,
      url: a.url,
      imageUrl: a.image,
      language: opts.language || 'en',
      publishedDate: a.dateTimePub ? new Date(a.dateTimePub) : new Date(),
      source: 'eventregistry',
    }));
  },
};

const FALLBACK_ORDER = ['newsapi', 'gnews', 'newsdata', 'mediastack', 'currents', 'bingnews', 'eventregistry'];

function urlHashOf(url) {
  return crypto.createHash('sha256').update(url.trim().toLowerCase()).digest('hex');
}

function normalizedTitleHash(title) {
  const normalized = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

function scoreArticle(article) {
  let score = 0;
  if (TRUSTED_PUBLISHERS.has(article.publisher)) score += 50;
  const ageHours = (Date.now() - new Date(article.publishedDate).getTime()) / 3600000;
  score += Math.max(0, 48 - ageHours); // fresher articles score higher
  if (article.imageUrl) score += 5;
  if (article.description && article.description.length > 50) score += 5;
  return score;
}

/**
 * Query all configured/enabled providers in parallel (respecting DB-driven priority/enable flags
 * when available), merge results, dedupe, score, and rank.
 */
async function aggregateNews(query, options = {}) {
  let order = FALLBACK_ORDER;
  try {
    const configs = await ApiConfiguration.find({ isEnabled: true }).sort({ priority: 1 });
    if (configs.length) order = configs.map((c) => c.provider);
  } catch (_) {
    // DB not reachable or not seeded yet — use default order
  }

  const settled = await Promise.allSettled(
    order.map((providerKey) => PROVIDERS[providerKey] ? PROVIDERS[providerKey](query, options) : Promise.reject(new Error('unknown provider')))
  );

  const merged = [];
  settled.forEach((result, idx) => {
    const providerKey = order[idx];
    if (result.status === 'fulfilled') {
      merged.push(...result.value);
      ApiConfiguration.updateOne(
        { provider: providerKey },
        { $set: { lastUsedAt: new Date(), lastError: null }, $inc: { usedToday: 1 } },
        { upsert: true }
      ).catch(() => {});
    } else {
      console.warn(`[newsAggregator] Provider "${providerKey}" failed:`, result.reason?.message);
      ApiConfiguration.updateOne(
        { provider: providerKey },
        { $set: { lastError: result.reason?.message || 'unknown error' } },
        { upsert: true }
      ).catch(() => {});
    }
  });

  // Deduplicate by URL hash, then by normalized title
  const seenUrlHashes = new Set();
  const seenTitleHashes = new Set();
  const deduped = [];

  for (const article of merged) {
    if (!article.title || !article.url) continue;
    const uHash = urlHashOf(article.url);
    const tHash = normalizedTitleHash(article.title);
    if (seenUrlHashes.has(uHash) || seenTitleHashes.has(tHash)) continue;
    seenUrlHashes.add(uHash);
    seenTitleHashes.add(tHash);
    deduped.push({
      ...article,
      urlHash: uHash,
      titleNormalizedHash: tHash,
      trustedPublisher: TRUSTED_PUBLISHERS.has(article.publisher),
      relevanceScore: scoreArticle(article),
    });
  }

  deduped.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return deduped;
}

/**
 * Fetch + persist. Uses upsert on urlHash to respect the unique index (idempotent).
 */
async function fetchAndStore(query, options = {}) {
  const articles = await aggregateNews(query, options);
  const ops = articles.map((a) => ({
    updateOne: {
      filter: { urlHash: a.urlHash },
      update: { $setOnInsert: a },
      upsert: true,
    },
  }));
  if (ops.length) await Article.bulkWrite(ops, { ordered: false }).catch((e) => {
    // Duplicate key races are expected/benign under bulk upsert; log anything else
    if (!/E11000/.test(e.message)) console.error('[newsAggregator] bulkWrite error', e.message);
  });
  return articles.length;
}

module.exports = { aggregateNews, fetchAndStore, PROVIDERS, FALLBACK_ORDER, urlHashOf, normalizedTitleHash };
