const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'app.db');

// Ensure data directory exists
const fs = require('fs');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    name TEXT,
    role TEXT DEFAULT 'admin',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS blog_posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT DEFAULT '',
    content TEXT DEFAULT '',
    category TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    published INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS suno_tracks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    genre TEXT DEFAULT '',
    url TEXT DEFAULT '',
    color TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT DEFAULT '',
    message TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS service_links (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT DEFAULT '',
    description TEXT DEFAULT '',
    icon TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Seed default admin if none exists
const adminExists = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (adminExists.count === 0) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)').run(
    uuidv4(), 'admin@manametamaori.com', hash, 'Admin', 'admin'
  );
}

// Seed settings
const settingsExist = db.prepare("SELECT COUNT(*) as count FROM settings").get();
if (settingsExist.count === 0) {
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('google_analytics_id', '');
}

// Seed blog posts if empty
const blogCount = db.prepare('SELECT COUNT(*) as count FROM blog_posts').get();
if (blogCount.count === 0) {
  const seedBlogs = [
    { id: 'b0f55d29-a704-40b8-b28b-c2310ee55ec1', title: 'S20 Festival Afterparty', slug: '/s2o-brisbane-survival-guide-2026', category: 'Festival', image_url: '/images/s2o-wet.png', published: 1, created_at: '2026-02-23T12:18:22.532Z', excerpt: '', content: "Survival of the Wettest: My S2O 2026 Game Plan\nIf you're planning to hit S2O Water Festival in Brisbane and don't want your bank account (or your iPhone) to end up in a watery grave, listen up. I've mapped out a journey from Labrador that proves you can rave hard without living on 2-minute noodles for the rest of the month." },
    { id: 'f9db2fb5-8e09-417b-81bf-bec62df05ab1', title: 'Building Secure Web Apps: A Cybersecurity Checklist for Developers', slug: 'secure-web-apps-checklist', category: 'Tutorials', image_url: '/images/blog-2.png', published: 1, created_at: '2026-02-16T14:52:53.261Z', excerpt: 'A comprehensive security checklist every developer should follow when building web applications.', content: "Security isn't something you bolt on at the end — it's something you build in from day one." },
    { id: 'ff83ba51-effa-4dc5-b4b5-13af1729d756', title: 'Quick & Easy Protein-Packed Developer Meals for Busy Coders', slug: 'protein-packed-developer-meals', category: 'Recipes', image_url: '/images/blog-3.png', published: 1, created_at: '2026-02-16T14:52:53.261Z', excerpt: 'Fuel your coding sessions with these quick, nutritious recipes designed for developers.', content: "As developers, we often neglect our nutrition. But what you eat directly impacts your cognitive performance." },
    { id: 'c8e015c9-74fd-4ab7-9274-1c4065fdfa33', title: 'ComfyUI Masterclass: Creating Stunning AI Art with Custom Workflows', slug: 'comfyui-masterclass-custom-workflows', category: 'Tech', image_url: '/images/blog-1.png', published: 1, created_at: '2026-02-16T14:52:53.261Z', excerpt: 'Learn how to build professional-grade ComfyUI workflows for consistent, high-quality AI art generation.', content: "ComfyUI has become the go-to tool for serious AI artists." },
    { id: '898237ee-855c-41b2-a543-5fb00227d407', title: 'The Future of Automation: How AI is Transforming Workflows in 2026', slug: 'future-of-automation-ai-2026', category: 'Tech', image_url: '/images/blog-1.png', published: 1, created_at: '2026-02-16T14:52:53.261Z', excerpt: 'Explore how artificial intelligence is revolutionizing business automation.', content: "The landscape of business automation is undergoing a seismic shift." },
    { id: '415361c8-a0a3-4a4e-bd66-3430d0418239', title: 'EDC Las Vegas 2026: The Ultimate Festival Guide & Lineup Preview', slug: 'edc-las-vegas-2026-guide', category: 'Festivals', image_url: '/images/blog-2.png', published: 1, created_at: '2026-02-16T14:52:53.261Z', excerpt: 'Everything you need to know about Electric Daisy Carnival 2026.', content: "Electric Daisy Carnival returns to the Las Vegas Motor Speedway." },
    { id: '1d00a22e-f49e-45eb-8a11-3f2d03823c98', title: 'Tomorrowland 2026: A Dream Festival Experience', slug: 'tomorrowland-2026-dream-experience', category: 'Festivals', image_url: '/images/blog-1.png', published: 1, created_at: '2026-02-16T14:52:53.261Z', excerpt: 'My journey to Tomorrowland in Belgium.', content: "Tomorrowland has been on my bucket list for years." },
    { id: 'ae871d62-50e1-4ff9-817f-9df9c4e798c5', title: 'Ultra Music Festival Miami 2026: Lineup, Tips & What to Expect', slug: 'ultra-miami-2026-lineup-tips', category: 'Festivals', image_url: '/images/blog-3.png', published: 1, created_at: '2026-02-16T14:52:53.261Z', excerpt: 'Breaking down Ultra Music Festival Miami 2026.', content: "Ultra Music Festival is back at Bayfront Park in downtown Miami." },
    { id: '1970272f-37f3-4b40-ac26-dac0db7bb633', title: 'Google Ads vs Meta Ads: Where Should You Spend Your Budget in 2026?', slug: 'google-ads-vs-meta-ads-2026', category: 'News', image_url: '/images/blog-2.png', published: 1, created_at: '2026-02-16T14:52:53.261Z', excerpt: 'An honest comparison of Google and Meta advertising platforms.', content: "The eternal question for digital marketers: Google or Meta?" },
  ];

  const insertBlog = db.prepare('INSERT INTO blog_posts (id, title, slug, excerpt, content, category, image_url, published, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  for (const b of seedBlogs) {
    insertBlog.run(b.id, b.title, b.slug, b.excerpt, b.content, b.category, b.image_url, b.published, b.created_at);
  }
}

// Seed suno tracks if empty
const trackCount = db.prepare('SELECT COUNT(*) as count FROM suno_tracks').get();
if (trackCount.count === 0) {
  const seedTracks = [
    { id: '7321e72d-3d79-4468-890b-bc9c00ab1308', title: 'Gestapo', genre: 'Dark Trance House', url: 'https://suno.com/s/H0is40En61b4R06e', color: 'from-gray-700 to-gray-900', sort_order: 0 },
    { id: 'cc58b883-77c0-4f44-b9e9-d2e85e1f8b87', title: 'Centrelinks My Baby Daddy', genre: 'Hard Drum & Bass', url: 'https://suno.com/s/OUy4qAlS9VnyVPmu', color: 'from-orange-600 to-red-700', sort_order: 1 },
    { id: '45616954-4402-44a9-8fdf-eff38bef865c', title: 'Trân', genre: 'Uplifting Power Ballad', url: 'https://suno.com/s/n42KfuiyJKaVstbH', color: 'from-pink-500 to-rose-600', sort_order: 2 },
    { id: '458b46a3-8de8-4945-a174-1e8d9d8b7f59', title: "Don't Stop", genre: 'House Club Mix', url: 'https://suno.com/s/OMn0wFkgV7itUSz0', color: 'from-blue-500 to-cyan-600', sort_order: 3 },
    { id: '20baf92e-6024-4e4b-8984-0312c571d05a', title: 'Cong Tu Bac Lieu', genre: 'Vietnamese Drum & Bass', url: 'https://suno.com/s/9ArbjyLoLYVeTXGE', color: 'from-emerald-500 to-teal-600', sort_order: 4 },
    { id: 'e44759a7-4a4c-4cc3-886f-1ad983ca8036', title: 'Xin Lỗi', genre: 'Traditional Vietnamese', url: 'https://suno.com/s/DDNmF73zE2c98E75', color: 'from-amber-500 to-yellow-600', sort_order: 5 },
  ];

  const insertTrack = db.prepare('INSERT INTO suno_tracks (id, title, genre, url, color, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
  for (const t of seedTracks) {
    insertTrack.run(t.id, t.title, t.genre, t.url, t.color, t.sort_order);
  }
}

module.exports = db;
