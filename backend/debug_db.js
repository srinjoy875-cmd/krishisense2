require('dotenv').config();
const { pool } = require('./config/db');

async function checkData() {
  try {
    const res = await pool.query('SELECT created_at, sunlight FROM sensor_data ORDER BY created_at DESC LIMIT 10');
    console.table(res.rows.map(row => ({
      time: row.created_at.toLocaleString(),
      sunlight: row.sunlight,
      type: typeof row.sunlight
    })));
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

checkData();
