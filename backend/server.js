const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const cors = require('cors');
const PORT = process.env.PORT || 3000;
// Use CORS middleware
app.use(cors());
// Create SQLite database connection
const db = new sqlite3.Database('database.db', (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    // Create Counter table if not exists
    db.run('CREATE TABLE IF NOT EXISTS Counter (id INTEGER PRIMARY KEY, value INTEGER)', (err) => {
      if (err) {
        console.error('Error creating Counter table:', err.message);
      } else {
        console.log('Counter table created or already exists.');
      }
    });
  }
});

// Endpoint to load data
app.get('/load', (req, res) => {
  db.all('SELECT * FROM Counter', (err, rows) => {
    if (err) {
      console.error('Error loading data:', err.message);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      const counterData = {};
      rows.forEach(row => {
        counterData[row.id] = row.value;
      });
      res.json(counterData);
    }
  });
});

// Endpoint to save data
app.post('/save', express.json(), (req, res) => {
  const counterData = req.body;
  if (typeof counterData !== 'object') {
    res.status(400).json({ error: 'Invalid data. Must be an object.' });
    return;
  }

  db.serialize(() => {
    db.run('DELETE FROM Counter', (err) => {
      if (err) {
        console.error('Error clearing table:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }

      const stmt = db.prepare('INSERT INTO Counter (id, value) VALUES (?, ?)');
      Object.entries(counterData).forEach(([id, value]) => {
        stmt.run(id, value);
      });
      stmt.finalize((err) => {
        if (err) {
          console.error('Error saving data:', err.message);
          res.status(500).json({ error: 'Internal Server Error' });
        } else {
          res.json({ message: 'Data saved successfully.' });
        }
      });
    });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});