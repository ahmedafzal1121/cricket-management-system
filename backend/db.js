const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.connect()
    .then(() => console.log("✅ Supabase DB connected"))
    .catch(err => console.log("❌ DB connection error:", err.message));

module.exports = pool;