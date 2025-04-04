const bcrypt = require("bcrypt");
const db = require("./db");

const saltRounds = 10;

const addUser = (username, password, role = "student", callback) => {
  bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
    if (err) return callback(err);

    const sql = "INSERT INTO users (username, password, role) VALUES (?, ?, ?)";
    db.query(sql, [username, hashedPassword, role], (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  });
};

const verifyUser = (username, password, callback) => {
  const sql = "SELECT * FROM users WHERE username = ?";
  db.query(sql, [username], (err, results) => {
    if (err) return callback(err);
    if (results.length === 0) return callback(null, null);

    const user = results[0];
    bcrypt.compare(password, user.password, (err, match) => {
      if (err) return callback(err);
      if (match) {
        return callback(null, user);
      } else {
        return callback(null, null);
      }
    });
  });
};

module.exports = { addUser, verifyUser };
