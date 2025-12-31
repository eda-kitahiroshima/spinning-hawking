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
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      is_template BOOLEAN DEFAULT FALSE,
      parent_id INTEGER REFERENCES apps(id) ON DELETE SET NULL,
      public_status TEXT DEFAULT 'private'
    )`);

        // Migration: Add columns if they don't exist (for existing DBs)
        try {
            await query("ALTER TABLE apps ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE");
            await query("ALTER TABLE apps ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES apps(id) ON DELETE SET NULL");
            await query("ALTER TABLE apps ADD COLUMN IF NOT EXISTS public_status TEXT DEFAULT 'private'");
        } catch (e) {
            console.log("Migration note: Columns might already exist or auto-migration not supported fully.", e.message);
        }

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

        // Seed data (TEMPLATES)
        // Check if templates exist
        const templateRes = await query("SELECT count(*) as count FROM apps WHERE is_template = TRUE");
        if (parseInt(templateRes.rows[0].count) === 0) {
            console.log("Seeding templates...");
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

            const templates = [
                {
                    name: "Todo List",
                    description: "シンプルで使いやすいタスク管理アプリ。LocalStorageに保存されます。",
                    code: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Todo List</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-gray-100 min-h-screen p-8"><div class="max-w-md mx-auto bg-white rounded-lg shadow-md p-6"><h1 class="text-2xl font-bold mb-4 text-center">Todo List</h1><div class="flex mb-4"><input type="text" id="taskInput" class="flex-grow border rounded-l px-4 py-2" placeholder="新しいタスク..."><button onclick="addTask()" class="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600">追加</button></div><ul id="taskList" class="space-y-2"></ul></div><script>function addTask(){const input=document.getElementById('taskInput');const text=input.value.trim();if(text){const li=document.createElement('li');li.className="flex justify-between items-center bg-gray-50 p-3 rounded";li.innerHTML=\`<span>\${text}</span><button onclick="this.parentElement.remove()" class="text-red-500 hover:text-red-700">削除</button>\`;document.getElementById('taskList').appendChild(li);input.value='';}}</script></body></html>`,
                    tags: JSON.stringify(["Efficiency", "Tool", "Template"]),
                    is_template: true
                },
                {
                    name: "Simple Calculator",
                    description: "基本的な四則演算ができる電卓アプリ。",
                    code: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Calculator</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-gray-100 min-h-screen flex items-center justify-center"><div class="bg-white p-6 rounded-xl shadow-lg w-64"><input type="text" id="display" class="w-full mb-4 text-right text-3xl font-bold p-2 border-b" readonly><div class="grid grid-cols-4 gap-2"><button onclick="clearDisplay()" class="col-span-3 bg-red-100 text-red-600 p-4 rounded font-bold">C</button><button onclick="append('/')" class="bg-gray-200 p-4 rounded">/</button><button onclick="append('7')" class="bg-gray-100 p-4 rounded">7</button><button onclick="append('8')" class="bg-gray-100 p-4 rounded">8</button><button onclick="append('9')" class="bg-gray-100 p-4 rounded">9</button><button onclick="append('*')" class="bg-gray-200 p-4 rounded">×</button><button onclick="append('4')" class="bg-gray-100 p-4 rounded">4</button><button onclick="append('5')" class="bg-gray-100 p-4 rounded">5</button><button onclick="append('6')" class="bg-gray-100 p-4 rounded">6</button><button onclick="append('-')" class="bg-gray-200 p-4 rounded">-</button><button onclick="append('1')" class="bg-gray-100 p-4 rounded">1</button><button onclick="append('2')" class="bg-gray-100 p-4 rounded">2</button><button onclick="append('3')" class="bg-gray-100 p-4 rounded">3</button><button onclick="append('+')" class="bg-gray-200 p-4 rounded">+</button><button onclick="append('0')" class="col-span-2 bg-gray-100 p-4 rounded">0</button><button onclick="append('.')" class="bg-gray-100 p-4 rounded">.</button><button onclick="calculate()" class="bg-blue-500 text-white p-4 rounded">=</button></div></div><script>let display=document.getElementById('display');function append(v){display.value+=v}function clearDisplay(){display.value=''}function calculate(){try{display.value=eval(display.value)}catch(e){display.value='Error'}}</script></body></html>`,
                    tags: JSON.stringify(["Math", "Utility", "Template"]),
                    is_template: true
                },
                {
                    name: "Digital Clock",
                    description: "現在時刻を表示するシンプルなデジタル時計。",
                    code: `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Digital Clock</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-gray-900 min-h-screen flex items-center justify-center text-white"><div class="text-center"><h1 id="clock" class="text-9xl font-mono font-bold tracking-widest text-blue-400 drop-shadow-lg">00:00:00</h1><p id="date" class="mt-4 text-2xl text-gray-400">Loading...</p></div><script>function update(){const now=new Date();document.getElementById('clock').innerText=now.toLocaleTimeString('ja-JP');document.getElementById('date').innerText=now.toLocaleDateString('ja-JP',{weekday:'long',year:'numeric',month:'long',day:'numeric'});}setInterval(update,1000);update();</script></body></html>`,
                    tags: JSON.stringify(["Time", "Widget", "Template"]),
                    is_template: true
                },
                {
                    name: "Memo Pad",
                    description: "ブラウザに自動保存されるシンプルなメモ帳。",
                    code: `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Memo</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-yellow-50 min-h-screen p-8"><div class="max-w-2xl mx-auto"><h1 class="text-3xl font-serif text-gray-700 mb-4">Memo Pad</h1><textarea id="memo" class="w-full h-96 p-6 rounded-lg shadow-inner bg-white text-lg leading-relaxed focus:outline-none focus:ring-2 ring-yellow-300" placeholder="Type here..."></textarea><p class="text-right text-sm text-gray-400 mt-2">Auto-saved</p></div><script>const memo=document.getElementById('memo');memo.value=localStorage.getItem('memo_pad_data')||'';memo.addEventListener('input',()=>{localStorage.setItem('memo_pad_data',memo.value)});</script></body></html>`,
                    tags: JSON.stringify(["Writing", "Tool", "Template"]),
                    is_template: true
                },
                {
                    name: "Omikuji",
                    description: "今日の運勢を占うおみくじアプリ。",
                    code: `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>おみくじ</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-red-50 min-h-screen flex flex-col items-center justify-center"><div class="bg-white p-12 rounded-3xl shadow-xl text-center max-w-sm w-full"><h1 class="text-4xl font-bold text-red-600 mb-8">⛩ おみくじ</h1><div id="result" class="text-6xl font-black text-gray-800 h-24 mb-6 flex items-center justify-center">?</div><button onclick="draw()" class="w-full bg-red-600 text-white font-bold py-4 rounded-full hover:bg-red-700 transition transform hover:scale-105 shadow-lg">おみくじを引く</button></div><script>function draw(){const results=['大吉','中吉','小吉','吉','末吉','凶'];const r=results[Math.floor(Math.random()*results.length)];const el=document.getElementById('result');el.style.opacity=0;setTimeout(()=>{el.innerText=r;el.style.opacity=1},200);}</script></body></html>`,
                    tags: JSON.stringify(["Fun", "Game", "Template"]),
                    is_template: true
                }
            ];

            for (const t of templates) {
                await query(
                    "INSERT INTO apps (name, description, code, downloadUrl, screenshotUrl, tags, user_id, is_template, public_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
                    [t.name, t.description, t.code, "#", `https://placehold.co/600x400/EEE/333?text=${encodeURIComponent(t.name)}`, t.tags, adminId, t.is_template, 'template']
                );
            }
            console.log("Templates seeded.");
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