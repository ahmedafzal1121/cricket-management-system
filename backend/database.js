const mysql = require('mysql2');

// Railway will provide these environment variables
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'Ahmed1234',
    database: process.env.MYSQL_DATABASE || 'cricket_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

// Test connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        console.error('Connection details:');
        console.error('- Host:', process.env.MYSQL_HOST || 'localhost');
        console.error('- User:', process.env.MYSQL_USER || 'root');
        console.error('- Database:', process.env.MYSQL_DATABASE || 'cricket_management');
    } else {
        console.log('✅ Database connected successfully');
        console.log('📊 Database:', process.env.MYSQL_DATABASE || 'cricket_management');
        connection.release();
    }
});

module.exports = promisePool;