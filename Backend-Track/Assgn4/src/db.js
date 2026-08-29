const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      done BOOLEAN NOT NULL DEFAULT FALSE
    )
  `);

  const result = await pool.query(
    "SELECT COUNT(*)::int AS count FROM tasks"
  );

  if (result.rows[0].count === 0) {
    await pool.query(`
      INSERT INTO tasks (title, done)
      VALUES
        ('Learn PostgreSQL', false),
        ('Build REST API', false),
        ('Deploy application', false)
    `);
  }
}

module.exports = {
  pool,
  initializeDatabase,
};