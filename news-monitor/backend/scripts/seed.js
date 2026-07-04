require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Category = require('../models/Category');
const Tag = require('../models/Tag');
const ApiConfiguration = require('../models/ApiConfiguration');

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const DEFAULT_CATEGORIES = [
  'Steel', 'Coal', 'Iron Ore', 'RINL', 'Vizag Steel',
  'Manufacturing', 'Mining', 'Government Policies', 'Exports', 'Imports',
  'Logistics', 'Infrastructure', 'Energy', 'Commodity Prices',
  'Industrial Production', 'Global Steel Market', 'Shipping', 'Ports', 'Environmental Policies',
];

const DEFAULT_TAGS = [
  'Steel Prices', 'Coking Coal', 'Green Steel', 'Hydrogen Steel',
  'Railway Freight', 'Iron Ore Imports', 'Scrap Market',
];

const PROVIDERS = [
  { provider: 'newsapi', priority: 0 },
  { provider: 'gnews', priority: 1 },
  { provider: 'newsdata', priority: 2 },
  { provider: 'mediastack', priority: 3 },
  { provider: 'currents', priority: 4 },
  { provider: 'bingnews', priority: 5 },
  { provider: 'eventregistry', priority: 6 },
];

async function seed() {
  await connectDB();

  for (const name of DEFAULT_CATEGORIES) {
    await Category.findOneAndUpdate(
      { slug: slugify(name) },
      { $setOnInsert: { name, slug: slugify(name), isDefault: true } },
      { upsert: true }
    );
  }
  console.log(`[seed] Ensured ${DEFAULT_CATEGORIES.length} default categories.`);

  for (const name of DEFAULT_TAGS) {
    await Tag.findOneAndUpdate(
      { slug: slugify(name) },
      { $setOnInsert: { name, slug: slugify(name), isCustom: false } },
      { upsert: true }
    );
  }
  console.log(`[seed] Ensured ${DEFAULT_TAGS.length} default tags.`);

  for (const p of PROVIDERS) {
    await ApiConfiguration.findOneAndUpdate(
      { provider: p.provider },
      { $setOnInsert: { ...p, isEnabled: true } },
      { upsert: true }
    );
  }
  console.log(`[seed] Ensured ${PROVIDERS.length} API provider configs.`);

  console.log('[seed] Done.');
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
