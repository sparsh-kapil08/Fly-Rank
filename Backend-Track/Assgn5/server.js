const client = require("./db.js");
const express = require("express");
const app=express();
const PORT=process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running and connected to supabase`);
});