const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

// CORS 설정
app.use(
  cors({
    origin: [
      "https://main.d2n5k148zzb8mj.amplifyapp.com",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

const PORT = process.env.PORT || 8080;

/**
 * 1️⃣ 사용자 이름 저장
 */
app.post("/user", (req, res) => {
  const { username } = req.body;

  if (!username || username.trim().length < 2) {
    return res.status(400).json({
      message: "닉네임은 2자 이상이어야 합니다",
    });
  }

  const query = `INSERT INTO users (username) VALUES (?)`;

  db.run(query, [username], function (err) {
    if (err) {
      return res.status(500).json({ message: "DB 저장 실패" });
    }

    res.json({
      message: "사용자 저장 완료",
      userId: this.lastID,
      username,
    });
  });
});

/**
 * 2️⃣ 사용자 이름 조회 (가장 최근 사용자)
 */
app.get("/user", (req, res) => {
  const query = `
    SELECT id, username
    FROM users
    ORDER BY id DESC
    LIMIT 1
  `;

  db.get(query, (err, row) => {
    if (err) {
      return res.status(500).json({ message: "DB 조회 실패" });
    }

    if (!row) {
      return res.status(404).json({ message: "저장된 사용자 없음" });
    }

    res.json(row);
  });
});

app.post("/posts/:postId/comments", (req, res) => {
  const { postId } = req.params;
  const { username, content } = req.body;

  if (!username || !content) {
    return res.status(400).json({
      message: "username과 content는 필수입니다",
    });
  }

  const query = `
    INSERT INTO comments (post_id, username, content)
    VALUES (?, ?, ?)
  `;

  db.run(query, [postId, username, content], function (err) {
    if (err) {
      return res.status(500).json({ message: "댓글 저장 실패" });
    }

    res.json({
      message: "댓글 작성 완료",
      commentId: this.lastID,
    });
  });
});

app.get("/posts/:postId/comments", (req, res) => {
  const { postId } = req.params;

  const query = `
    SELECT id, username, content, created_at
    FROM comments
    WHERE post_id = ?
    ORDER BY created_at ASC
  `;

  db.all(query, [postId], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "댓글 조회 실패" });
    }

    res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`BE 서버 실행중 http://localhost:${PORT}`);
});
