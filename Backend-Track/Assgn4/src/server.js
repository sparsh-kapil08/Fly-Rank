require("dotenv").config();

const express = require("express");
const { initializeDatabase, pool } = require("./db");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

// GET all tasks
app.get("/tasks", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tasks");

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// GET task by ID
app.get("/tasks/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tasks WHERE id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Task not found",
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});


app.post("/tasks", async (req, res) => {
  try {
    const { title, done = false } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        error: "Title is required",
      });
    }

    const result = await pool.query(
      `INSERT INTO tasks (title, done)
       VALUES ($1, $2)
       RETURNING *`,
      [title.trim(), done]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});


app.put("/tasks/:id", async (req, res) => {
  try {
    const { title, done } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        error: "Title is required",
      });
    }

    const result = await pool.query(
      `UPDATE tasks
       SET title = $1, done = $2
       WHERE id = $3
       RETURNING *`,
      [title.trim(), done, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Task not found",
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

app.delete("/tasks/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Task not found",
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

async function startServer() {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

startServer();