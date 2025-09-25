const db = require('../db.js');
module.exports = {

  createUser: (user, callback) => {
    const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    db.query(sql, [user.username, user.email, user.password], callback);
  },

  findByEmail: (email, callback) => {
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], callback);
  },
  
  findAll: (callback) => {
    const sql = 'SELECT * FROM users';
    db.query(sql, callback);
  }
};