const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// DB 파일 위치
const dbPath = path.join(__dirname, "deepsea.db");

// DB 연결
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("DB 연결 실패", err);
  } else {
    console.log("SQLite DB 연결 성공");
  }
});

// 테이블 생성 (없으면)
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL
  )
`);

db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

module.exports = db;
