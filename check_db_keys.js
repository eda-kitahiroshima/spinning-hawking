require('dotenv').config({ path: './server/.env' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkKeys() {
    try {
        const res = await pool.query('SELECT * FROM apps LIMIT 1');
        console.log("Keys:", Object.keys(res.rows[0]));
        await pool.end();
    } catch (err) {
        console.error(err);
    }
}

checkKeys();
