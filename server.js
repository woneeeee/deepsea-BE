const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

// CORS 설정
// app.use(
//   cors({
//     origin: [
//       "https://main.d2n5k148zzb8mj.amplifyapp.com",
//       "http://localhost:3000",
//     ],
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

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
      console.error("DB 저장 에러:", err);
      return res.status(500).json({
        message: "DB 저장 실패",
        error: err.message,
      });
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
      console.error("DB 조회 에러:", err);
      return res.status(500).json({
        message: "DB 조회 실패",
        error: err.message,
      });
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
      console.error("댓글 저장 에러:", err);
      return res.status(500).json({
        message: "댓글 저장 실패",
        error: err.message,
      });
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
      console.error("댓글 조회 에러:", err);
      return res.status(500).json({
        message: "댓글 조회 실패",
        error: err.message,
      });
    }

    res.json(rows);
  });
});

/**
 * DB 초기화 (모든 데이터 삭제)
 */
app.delete("/db/reset", (req, res) => {
  // 모든 테이블의 데이터 삭제
  db.serialize(() => {
    db.run("DELETE FROM comments", (err) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "댓글 삭제 실패", error: err.message });
      }
    });

    db.run("DELETE FROM users", (err) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "사용자 삭제 실패", error: err.message });
      }
    });

    // SQLite의 AUTOINCREMENT 카운터도 리셋
    db.run(
      "DELETE FROM sqlite_sequence WHERE name IN ('users', 'comments')",
      (err) => {
        // sqlite_sequence 테이블이 없을 수도 있으므로 에러는 무시
      }
    );

    res.json({ message: "DB 초기화 완료" });
  });
});

app.listen(PORT, () => {
  console.log(`BE 서버 실행중 http://localhost:${PORT}`);
});
