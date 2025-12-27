require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Helper to run queries ensuring connection
const query = (text, params) => pool.query(text, params);

const initDb = async () => {
    try {
        console.log("Initializing database...");

        // Users table
        await query(`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password TEXT NOT NULL
    )`);

        // Apps table
        await query(`CREATE TABLE IF NOT EXISTS apps (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      code TEXT,
      downloadUrl TEXT,
      screenshotUrl TEXT,
      tags TEXT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
    )`);

        // Likes table
        await query(`CREATE TABLE IF NOT EXISTS likes (
      id SERIAL PRIMARY KEY,
      app_id INTEGER REFERENCES apps(id) ON DELETE CASCADE,
      user_id TEXT
    )`);

        // Comments table
        await query(`CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      app_id INTEGER REFERENCES apps(id) ON DELETE CASCADE,
      user_id TEXT,
      text TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

        // Seed data
        const res = await query("SELECT count(*) as count FROM apps");
        if (parseInt(res.rows[0].count) === 0) {
            console.log("Seeding database...");
            const defaultUserPass = bcrypt.hashSync('password', 10);

            // Check if admin user exists
            let adminId;
            const userRes = await query("SELECT id FROM users WHERE username = $1", ['admin']);
            if (userRes.rows.length === 0) {
                const insertUser = await query("INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id", ['admin', defaultUserPass]);
                adminId = insertUser.rows[0].id;
            } else {
                adminId = userRes.rows[0].id;
            }

            const mockApps = [
                {
                    name: "タスクマスター プロ",
                    description: "生産性を高めるための強力なタスク管理アプリケーション。",
                    code: "<h1>Task Master Pro</h1><p>Welcome!</p>",
                    downloadUrl: "#",
                    screenshotUrl: "https://placehold.co/600x400/292929/FFF?text=TaskMaster+Pro",
                    tags: JSON.stringify(["生産性", "Electron"])
                },
                {
                    name: "ピクセルペインター",
                    description: "直感的な操作で素晴らしいピクセルアートを作成できるツール。",
                    code: "<canvas></canvas><p>Pixel Painter</p>",
                    downloadUrl: "#",
                    screenshotUrl: "https://placehold.co/600x400/3e2929/FFF?text=Pixel+Painter",
                    tags: JSON.stringify(["クリエイティブ", "Canvas"])
                },
                {
                    name: "コードスニペットマネージャー",
                    description: "お気に入りのコードスニペットを瞬時に整理・アクセス。",
                    code: "<pre>const x = 10;</pre>",
                    downloadUrl: "#",
                    screenshotUrl: "https://placehold.co/600x400/293e29/FFF?text=CodeSnippet",
                    tags: JSON.stringify(["開発者", "ユーティリティ"])
                }
            ];

            for (const app of mockApps) {
                await query(
                    "INSERT INTO apps (name, description, code, downloadUrl, screenshotUrl, tags, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7)",
                    [app.name, app.description, app.code, app.downloadUrl, app.screenshotUrl, app.tags, adminId]
                );
            }
            console.log("Database seeded.");
        }

        console.log("Database initialized successfully.");
    } catch (err) {
        console.error("Error initializing database:", err);
    }
};

// Auto-init on verify connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error connecting to postgres:', err.message);
    } else {
        console.log('Connected to Postgres at:', res.rows[0].now);
        initDb(); // Run init/seed
    }
});

module.exports = {
    query,
    pool
};