const express = require('express');
const router = express.Router();
const db = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const JWT_SECRET = process.env.JWT_SECRET || 'manametamaori-secret-key-change-in-production';

// Multer setup for media uploads
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Auth middleware
function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// ─── Public routes ───

router.get('/blog', (req, res) => {
  const posts = db.prepare('SELECT * FROM blog_posts WHERE published = 1 ORDER BY created_at DESC').all();
  res.json(posts.map(p => ({
    id: p.id, title: p.title, slug: p.slug, excerpt: p.excerpt,
    content: p.content, category: p.category, imageUrl: p.image_url,
    published: !!p.published, createdAt: p.created_at
  })));
});

router.get('/suno-tracks', (req, res) => {
  const tracks = db.prepare('SELECT * FROM suno_tracks ORDER BY sort_order ASC').all();
  res.json(tracks.map(t => ({
    id: t.id, title: t.title, genre: t.genre, url: t.url,
    color: t.color, sortOrder: t.sort_order, createdAt: t.created_at
  })));
});

router.get('/service-links', (req, res) => {
  const links = db.prepare('SELECT * FROM service_links ORDER BY sort_order ASC').all();
  res.json(links);
});

router.get('/settings/public', (req, res) => {
  const ga = db.prepare("SELECT value FROM settings WHERE key = 'google_analytics_id'").get();
  res.json({ google_analytics_id: ga?.value || '' });
});

router.post('/contact', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  const id = uuidv4();
  db.prepare('INSERT INTO contacts (id, name, email, subject, message) VALUES (?, ?, ?, ?, ?)').run(id, name, email, subject, message);
  res.json({ message: 'Message sent successfully', id });
});

// ─── Auth routes ───

router.post('/admin/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

router.post('/admin/check-email', (req, res) => {
  const user = db.prepare('SELECT id, email FROM users WHERE email = ?').get(req.body.email);
  res.json({ exists: !!user, hasPassword: !!(user && db.prepare('SELECT password FROM users WHERE id = ?').get(user.id)?.password) });
});

router.post('/admin/setup-password', (req, res) => {
  const { email, password } = req.body;
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hash, email);
  res.json({ message: 'Password set' });
});

router.get('/admin/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

router.post('/admin/logout', (req, res) => {
  res.json({ message: 'Logged out' });
});

// ─── Admin CRUD ───

// Blog
router.get('/admin/blog', auth, (req, res) => {
  const posts = db.prepare('SELECT * FROM blog_posts ORDER BY created_at DESC').all();
  res.json(posts.map(p => ({
    id: p.id, title: p.title, slug: p.slug, excerpt: p.excerpt,
    content: p.content, category: p.category, imageUrl: p.image_url,
    published: !!p.published, createdAt: p.created_at
  })));
});

router.post('/admin/blog', auth, (req, res) => {
  const { title, slug, excerpt, content, category, imageUrl, published } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO blog_posts (id, title, slug, excerpt, content, category, image_url, published) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, title, slug, excerpt || '', content || '', category || '', imageUrl || '', published ? 1 : 0);
  res.json({ id, title, slug });
});

router.patch('/admin/blog/:id', auth, (req, res) => {
  const { title, slug, excerpt, content, category, imageUrl, published } = req.body;
  db.prepare('UPDATE blog_posts SET title=?, slug=?, excerpt=?, content=?, category=?, image_url=?, published=? WHERE id=?')
    .run(title, slug, excerpt || '', content || '', category || '', imageUrl || '', published ? 1 : 0, req.params.id);
  res.json({ message: 'Updated' });
});

router.delete('/admin/blog/:id', auth, (req, res) => {
  db.prepare('DELETE FROM blog_posts WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

// Suno tracks
router.get('/admin/suno-tracks', auth, (req, res) => {
  const tracks = db.prepare('SELECT * FROM suno_tracks ORDER BY sort_order ASC').all();
  res.json(tracks.map(t => ({
    id: t.id, title: t.title, genre: t.genre, url: t.url,
    color: t.color, sortOrder: t.sort_order, createdAt: t.created_at
  })));
});

router.post('/admin/suno-tracks', auth, (req, res) => {
  const { title, genre, url, color, sortOrder } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO suno_tracks (id, title, genre, url, color, sort_order) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, title, genre || '', url || '', color || '', sortOrder || 0);
  res.json({ id });
});

router.delete('/admin/suno-tracks/:id', auth, (req, res) => {
  db.prepare('DELETE FROM suno_tracks WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

// Service links
router.get('/admin/service-links', auth, (req, res) => {
  const links = db.prepare('SELECT * FROM service_links ORDER BY sort_order ASC').all();
  res.json(links);
});

// Settings
router.get('/admin/settings', auth, (req, res) => {
  const rows = db.prepare('SELECT * FROM settings').all();
  const settings = {};
  rows.forEach(r => settings[r.key] = r.value);
  res.json(settings);
});

router.patch('/admin/settings', auth, (req, res) => {
  const upsert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?');
  for (const [key, value] of Object.entries(req.body)) {
    upsert.run(key, value, value);
  }
  res.json({ message: 'Updated' });
});

// Contacts
router.get('/admin/contacts', auth, (req, res) => {
  const contacts = db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all();
  res.json(contacts.map(c => ({
    id: c.id, name: c.name, email: c.email, subject: c.subject,
    message: c.message, createdAt: c.created_at
  })));
});

// Media
router.get('/admin/media', auth, (req, res) => {
  const dir = path.join(__dirname, '..', 'public', 'uploads');
  if (!fs.existsSync(dir)) return res.json([]);
  const files = fs.readdirSync(dir).map(f => ({
    name: f, url: `/uploads/${f}`,
    size: fs.statSync(path.join(dir, f)).size
  }));
  res.json(files);
});

router.post('/admin/media', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file' });
  res.json({ url: `/uploads/${req.file.filename}`, name: req.file.filename });
});

module.exports = router;
