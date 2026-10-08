import express from 'express';
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Database initialization: backend/student_feedback.db
  const dbPath = path.resolve(__dirname, 'backend', 'student_feedback.db');
  const db = new DatabaseSync(dbPath);

  // Ensure table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_name TEXT NOT NULL,
      register_number TEXT NOT NULL,
      department TEXT NOT NULL,
      email TEXT,
      rating INTEGER NOT NULL,
      feedback TEXT NOT NULL,
      created_at DATETIME NOT NULL
    )
  `);

  // CORS headers for interoperability
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // REST API Routes matching FastAPI endpoints

  // 1. READ ALL: GET /feedback
  app.get('/feedback', (req, res) => {
    try {
      const rows = db.prepare('SELECT * FROM feedback ORDER BY id DESC').all();
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ detail: err.message });
    }
  });

  // 2. READ ONE: GET /feedback/:id
  app.get('/feedback/:id', (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const row = db.prepare('SELECT * FROM feedback WHERE id = ?').get(id);
      if (!row) {
        return res.status(404).json({ detail: `Feedback with ID ${id} not found` });
      }
      res.json(row);
    } catch (err: any) {
      res.status(500).json({ detail: err.message });
    }
  });

  // 3. CREATE: POST /feedback
  app.post('/feedback', (req, res) => {
    try {
      const { student_name, register_number, department, email, rating, feedback } = req.body;

      if (!student_name || !register_number || !department || rating === undefined || !feedback) {
        return res.status(422).json({ detail: 'Missing required feedback fields' });
      }

      const numRating = parseInt(rating, 10);
      if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        return res.status(422).json({ detail: 'Rating must be between 1 and 5' });
      }

      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

      const stmt = db.prepare(`
        INSERT INTO feedback (student_name, register_number, department, email, rating, feedback, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        String(student_name).trim(),
        String(register_number).trim(),
        String(department).trim(),
        email ? String(email).trim() : null,
        numRating,
        String(feedback).trim(),
        now
      );

      const insertedId = result.lastInsertRowid;
      const newRecord = db.prepare('SELECT * FROM feedback WHERE id = ?').get(insertedId);
      res.status(201).json(newRecord);
    } catch (err: any) {
      res.status(500).json({ detail: err.message });
    }
  });

  // 4. UPDATE: PUT /feedback/:id
  app.put('/feedback/:id', (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const existing: any = db.prepare('SELECT * FROM feedback WHERE id = ?').get(id);
      if (!existing) {
        return res.status(404).json({ detail: `Feedback with ID ${id} not found` });
      }

      const { student_name, register_number, department, email, rating, feedback } = req.body;
      const numRating = rating !== undefined ? parseInt(rating, 10) : existing.rating;

      if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        return res.status(422).json({ detail: 'Rating must be between 1 and 5' });
      }

      const stmt = db.prepare(`
        UPDATE feedback
        SET student_name = ?, register_number = ?, department = ?, email = ?, rating = ?, feedback = ?
        WHERE id = ?
      `);

      stmt.run(
        student_name !== undefined ? String(student_name).trim() : existing.student_name,
        register_number !== undefined ? String(register_number).trim() : existing.register_number,
        department !== undefined ? String(department).trim() : existing.department,
        email !== undefined ? (email ? String(email).trim() : null) : existing.email,
        numRating,
        feedback !== undefined ? String(feedback).trim() : existing.feedback,
        id
      );

      const updated = db.prepare('SELECT * FROM feedback WHERE id = ?').get(id);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ detail: err.message });
    }
  });

  // 5. DELETE: DELETE /feedback/:id
  app.delete('/feedback/:id', (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const existing = db.prepare('SELECT * FROM feedback WHERE id = ?').get(id);
      if (!existing) {
        return res.status(404).json({ detail: `Feedback with ID ${id} not found` });
      }

      db.prepare('DELETE FROM feedback WHERE id = ?').run(id);
      res.json({ message: `Feedback with ID ${id} deleted successfully` });
    } catch (err: any) {
      res.status(500).json({ detail: err.message });
    }
  });

  // Static files for frontend
  app.use('/frontend', express.static(path.resolve(__dirname, 'frontend')));

  // In development, mount Vite middleware so the developer experience is smooth
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.use(express.static(path.resolve(__dirname, 'frontend')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'frontend', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Student Feedback Management System server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
