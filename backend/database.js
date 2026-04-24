const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'auth.db');
let db;

async function initDatabase() {
  const SQL = await initSqlJs();
  
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'USER',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  saveDatabase();
  initAdmin();
  
  return db;
}

function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function initAdmin() {
  const result = db.exec('SELECT * FROM users WHERE username = ?', ['sa']);
  
  if (result.length === 0 || result[0].values.length === 0) {
    const hashedPassword = bcrypt.hashSync('123456', 10);
    db.run(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      ['sa', hashedPassword, 'ADMIN']
    );
    saveDatabase();
    console.log('Super admin user created: username=sa, password=123456');
  }
}

module.exports = {
  initDatabase,
  saveDatabase,
  getDb: () => db
};
