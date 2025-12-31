require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./database'); // This now exports { query, pool }

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const upload = require('./storage'); // New storage module
const { generateAppCode, editAppCode } = require('./ai-service'); // AI code generation

// --- 【新規追加】AI生成・編集エンドポイント ---
app.post('/api/ai/generate', async (req, res) => {
  const { prompt } = req.body;
  try {
    const code = await generateAppCode(prompt);
    res.json({ code });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/edit', async (req, res) => {
  const { currentCode, instruction } = req.body;
  try {
    const newCode = await editAppCode(currentCode, instruction);
    res.json({ code: newCode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ファイルアップロード設定 (Removed inline multer) ---
// public/uploads creation is handled inside storage.js for local mode
// or ignored for s3 mode.
// We still serve static files from public for local mode backup.


// --- 【新規追加】アプリのプレビュー画面を表示するエンドポイント ---
app.get('/preview/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query("SELECT code FROM apps WHERE id = $1", [id]);
    if (!rows.length || !rows[0].code) return res.status(404).send("<h1>Application Not Found</h1><p>アプリのコードが見つかりません。</p>");
    res.setHeader('Content-Type', 'text/html');
    res.send(rows[0].code);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// --- 【新規追加】公式テンプレート一覧取得 ---
app.get('/api/templates', async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM apps WHERE is_template = TRUE ORDER BY id ASC");
    res.json(rows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags || "[]"),
      screenshotUrl: row.screenshoturl || row.screenshotUrl
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 【新規追加】テンプレートからフォークして作成 ---
app.post('/api/apps/fork', async (req, res) => {
  const { templateId, userId } = req.body;
  if (!templateId) return res.status(400).json({ error: "Template ID is required" });

  try {
    // Get template data
    const { rows } = await db.query("SELECT * FROM apps WHERE id = $1", [templateId]);
    if (rows.length === 0) return res.status(404).json({ error: "Template not found" });
    const original = rows[0];

    // Create copy with parent_id set
    // New name will be "Copy of [Original Name]"
    const newName = `Copy of ${original.name}`;

    // We don't copy is_template (default false) or public_status (default private)
    const insertRes = await db.query(
      "INSERT INTO apps (name, description, code, screenshotUrl, tags, user_id, parent_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
      [newName, original.description, original.code, original.screenshoturl || original.screenshotUrl, original.tags, userId, templateId]
    );
    const appId = insertRes.rows[0].id;

    // Generate download/preview URL
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const downloadUrl = `${baseUrl}/preview/${appId}`;
    await db.query("UPDATE apps SET downloadUrl = $1 WHERE id = $2", [downloadUrl, appId]);

    res.status(201).json({ id: appId, message: "Forked successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- タグ取得 ---
app.get('/api/tags/top', async (req, res) => {
  try {
    const { rows } = await db.query("SELECT tags FROM apps");
    const tagCounts = {};
    rows.forEach(row => {
      try {
        const tags = JSON.parse(row.tags);
        if (Array.isArray(tags)) tags.forEach(t => { if (t) tagCounts[t.trim()] = (tagCounts[t.trim()] || 0) + 1; });
      } catch (e) { }
    });
    const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([tag]) => tag);
    res.json(sortedTags);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- アプリ一覧取得 ---
app.get('/api/apps', async (req, res) => {
  const { q, tag } = req.query;
  // Hide templates from main feed usually, unless requested?
  // For now let's just show everything but maybe distinct visually in frontend.
  // Actually, users probably want to see regular apps here. Templates are separate.
  // Let's filter WHERE is_template = FALSE by default unless specified? 
  // User didn't specify requirements for feed mixed/split. I'll stick to showing ALL for now to avoid hiding user apps.
  let queryText = `SELECT apps.*, COUNT(DISTINCT likes.id) as likeCount, COUNT(DISTINCT comments.id) as commentCount 
               FROM apps LEFT JOIN likes ON apps.id = likes.app_id LEFT JOIN comments ON apps.id = comments.app_id WHERE is_template = FALSE`;
  // Changed: Filter out templates from main feed to keep it clean. Templates have their own section.

  const params = [];

  if (q) {
    params.push(`%${q}%`, `%${q}%`);
    queryText += ` AND(apps.name ILIKE $${params.length - 1} OR apps.description ILIKE $${params.length})`; // ILIKE for case-insensitive
  }
  if (tag) {
    params.push(`%${tag}%`);
    queryText += ` AND apps.tags ILIKE $${params.length} `;
  }
  queryText += ` GROUP BY apps.id ORDER BY apps.id DESC`;

  try {
    const { rows } = await db.query(queryText, params);
    // Parse tags manually as before
    res.json(rows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags || "[]"),
      screenshotUrl: row.screenshoturl || row.screenshotUrl,
      downloadUrl: row.downloadurl || row.downloadUrl
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 【新規追加】特定のアプリを取得 ---
app.get('/api/apps/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query("SELECT * FROM apps WHERE id = $1", [id]);
    if (!rows.length) return res.status(404).json({ error: "App not found" });
    const row = rows[0];
    try { row.tags = JSON.parse(row.tags || "[]"); } catch (e) { row.tags = []; }
    // Map lowercase keys to camelCase
    row.screenshotUrl = row.screenshoturl || row.screenshotUrl;
    row.downloadUrl = row.downloadurl || row.downloadUrl;
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 【新規追加】特定ユーザーのアプリ一覧を取得 ---
app.get('/api/apps/user/:userId', async (req, res) => {
  const { userId } = req.params;
  const queryText = `SELECT apps.*, COUNT(DISTINCT likes.id) as likeCount, COUNT(DISTINCT comments.id) as commentCount 
               FROM apps LEFT JOIN likes ON apps.id = likes.app_id LEFT JOIN comments ON apps.id = comments.app_id
               WHERE apps.user_id = $1
               GROUP BY apps.id ORDER BY apps.id DESC`;
  try {
    const { rows } = await db.query(queryText, [userId]);
    res.json(rows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags || "[]"),
      screenshotUrl: row.screenshoturl || row.screenshotUrl,
      downloadUrl: row.downloadurl || row.downloadUrl
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 【新規追加】アプリ情報の更新 ---
app.put('/api/apps/:id', upload.single('screenshot'), async (req, res) => {
  const { id } = req.params;
  const { name, description, downloadUrl, screenshotUrl, tags, code } = req.body;

  const getPublicUrl = (file) => {
    if (!file) return null;
    if (process.env.AWS_PUBLIC_DOMAIN && file.key) {
      return `${process.env.AWS_PUBLIC_DOMAIN}/${file.key}`;
    }
    return file.location || `/uploads/${file.filename}`;
  };
  const newScreenshotUrl = req.file ? getPublicUrl(req.file) : screenshotUrl;
  let tagsString = '[]';
  try {
    tagsString = JSON.stringify(tags ? (tags.startsWith('[') ? JSON.parse(tags) : tags.split(',').map(t => t.trim())) : []);
  } catch (e) { /* ignore */ }

  try {
    const sql = `UPDATE apps SET name = $1, description = $2, downloadUrl = $3, screenshotUrl = $4, tags = $5, code = $6 WHERE id = $7`;
    const result = await db.query(sql, [name, description, downloadUrl, newScreenshotUrl, tagsString, code, id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "App not found or no changes made" });
    res.json({ message: "Updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- アプリ削除 ---
app.delete('/api/apps/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query("DELETE FROM apps WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "App not found" });
    }
    res.status(200).json({ message: "App deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 【重要修正】新規投稿処理 (データベースへのコード保存とURL自動生成) ---
app.post('/api/apps', upload.single('screenshot'), async (req, res) => {
  const { name, description, code, tags, userId, downloadUrl } = req.body;

  // Convert userId to integer (FormData sends it as string)
  const userIdInt = userId ? parseInt(userId, 10) : null;

  const getPublicUrl = (file) => {
    if (!file) return null;
    if (process.env.AWS_PUBLIC_DOMAIN && file.key) {
      return `${process.env.AWS_PUBLIC_DOMAIN}/${file.key}`;
    }
    return file.location || `/uploads/${file.filename}`;
  };
  const screenshotUrl = req.file ? getPublicUrl(req.file) : "https://placehold.co/600x400/000000/FFF?text=No+Image";

  let tagsString = '[]';
  try { tagsString = JSON.stringify(tags ? (tags.startsWith('[') ? JSON.parse(tags) : tags.split(',').map(t => t.trim())) : []); } catch (e) { /* ignore */ }

  try {
    const insertRes = await db.query(
      "INSERT INTO apps (name, description, code, screenshotUrl, tags, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [name, description, code, screenshotUrl, tagsString, userIdInt]
    );
    const appId = insertRes.rows[0].id;

    // Use user-provided downloadUrl, or auto-generate if empty
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const finalDownloadUrl = downloadUrl || `${baseUrl}/preview/${appId}`;
    await db.query("UPDATE apps SET downloadUrl = $1 WHERE id = $2", [finalDownloadUrl, appId]);

    console.log("✅ App Created!");
    console.log("📷 Screenshot URL:", screenshotUrl);

    res.status(201).json({ id: appId, downloadUrl: finalDownloadUrl, message: "Success" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- いいね・コメント機能 ---
// --- いいね・コメント機能 ---
app.post('/api/apps/:id/like', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ error: "User ID required" });

  try {
    // Check if already liked? Schema allows duplicate (user_id is TEXT, table has unique id).
    // Assuming naive implementation for now:
    await db.query("INSERT INTO likes (app_id, user_id) VALUES ($1, $2)", [id, userId]);

    const { rows } = await db.query("SELECT COUNT(*) as count FROM likes WHERE app_id = $1", [id]);
    res.json({ likeCount: rows[0].count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/apps/:id/comments', async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM comments WHERE app_id = $1 ORDER BY created_at DESC", [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/apps/:id/comments', async (req, res) => {
  const { id } = req.params;
  const { userId, text } = req.body;
  try {
    const insertRes = await db.query("INSERT INTO comments (app_id, user_id, text) VALUES ($1, $2, $3) RETURNING *", [id, userId, text]);
    res.status(201).json(insertRes.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 認証機能 (ログイン・登録) ---
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const result = await db.query("INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id", [username, hashedPassword]);
    const userId = result.rows[0].id;
    const token = jwt.sign({ userId, username }, JWT_SECRET); // Should match key variable
    res.status(201).json({ token, userId, username });
  } catch (err) {
    if (err.message.includes('unique constraint') || err.code === '23505') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const { rows } = await db.query("SELECT * FROM users WHERE username = $1", [username]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, username: user.username, userId: user.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Serve React App in Production ---
if (process.env.NODE_ENV === 'production') {
  // Serve static files from React build
  app.use(express.static(path.join(__dirname, '../client/dist')));

  // All other routes return the React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));