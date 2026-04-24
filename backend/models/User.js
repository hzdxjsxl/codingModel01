const { getDb, saveDatabase } = require('../database');
const bcrypt = require('bcryptjs');

class User {
  constructor(user) {
    this.id = user.id;
    this.username = user.username;
    this.role = user.role;
    this.createdAt = user.created_at;
    this.updatedAt = user.updated_at;
  }
  
  static mapResultToUser(result) {
    if (!result || result.length === 0 || result[0].values.length === 0) {
      return null;
    }
    
    const columns = result[0].columns;
    const values = result[0].values[0];
    
    const user = {};
    columns.forEach((col, index) => {
      user[col] = values[index];
    });
    
    return new User(user);
  }
  
  static mapResultToUsers(result) {
    if (!result || result.length === 0) {
      return [];
    }
    
    const columns = result[0].columns;
    const rows = result[0].values;
    
    return rows.map(values => {
      const user = {};
      columns.forEach((col, index) => {
        user[col] = values[index];
      });
      return new User(user);
    });
  }
  
  static findByUsername(username) {
    const db = getDb();
    const result = db.exec('SELECT * FROM users WHERE username = ?', [username]);
    return User.mapResultToUser(result);
  }
  
  static findById(id) {
    const db = getDb();
    const result = db.exec('SELECT * FROM users WHERE id = ?', [id]);
    return User.mapResultToUser(result);
  }
  
  static findAll() {
    const db = getDb();
    const result = db.exec('SELECT * FROM users');
    return User.mapResultToUsers(result);
  }
  
  static existsByUsername(username) {
    const db = getDb();
    const result = db.exec('SELECT COUNT(*) as count FROM users WHERE username = ?', [username]);
    if (!result || result.length === 0 || result[0].values.length === 0) {
      return false;
    }
    return result[0].values[0][0] > 0;
  }
  
  static create(username, password, role = 'USER') {
    const db = getDb();
    const hashedPassword = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();
    
    db.run(
      'INSERT INTO users (username, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, role, now, now]
    );
    saveDatabase();
    
    const lastIdResult = db.exec('SELECT last_insert_rowid() as id');
    const lastId = lastIdResult[0].values[0][0];
    
    return User.findById(lastId);
  }
  
  static verifyPassword(user, password) {
    const db = getDb();
    const result = db.exec('SELECT password FROM users WHERE id = ?', [user.id]);
    if (!result || result.length === 0 || result[0].values.length === 0) {
      return false;
    }
    const storedPassword = result[0].values[0][0];
    return bcrypt.compareSync(password, storedPassword);
  }
  
  toJSON() {
    return {
      id: this.id,
      username: this.username,
      role: this.role,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = User;
