require("dotenv").config();

const express = require("express");
const { initializeDatabase } = require("./db");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:");
    console.error(error);
  }
}

startServer();