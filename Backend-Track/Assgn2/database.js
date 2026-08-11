const database=require("better-sqlite3");
const db=new database("tasks.db");
try{
    db.exec(`CREATE TABLE tasks(
        id INTEGER PRIMARY KEY,
        title VARCHAR(225),
        done BOOLEAN)`);
    console.log("INITIATED DATABASE");
} catch (error) {
    console.error("Error occurred while initializing database:", error);
}