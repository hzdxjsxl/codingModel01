const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = User.findByUsername(username);
  
  if (!user) {
    return res.json({
      success: false,
      message: 'User not found'
    });
  }
  
  if (!User.verifyPassword(user, password)) {
    return res.json({
      success: false,
      message: 'Invalid password'
    });
  }
  
  return res.json({
    success: true,
    message: 'Login successful',
    user: user.toJSON()
  });
});

router.post('/register', (req, res) => {
  const { username, password } = req.body;
  
  if (User.existsByUsername(username)) {
    return res.json({
      success: false,
      message: 'Username already exists'
    });
  }
  
  const user = User.create(username, password, 'USER');
  
  return res.json({
    success: true,
    message: 'Registration successful',
    user: user.toJSON()
  });
});

module.exports = router;
