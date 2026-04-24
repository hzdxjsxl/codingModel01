const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/', (req, res) => {
  const users = User.findAll();
  
  return res.json({
    success: true,
    users: users.map(user => user.toJSON())
  });
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const user = User.findById(id);
  
  if (!user) {
    return res.json({
      success: false,
      message: 'User not found'
    });
  }
  
  return res.json({
    success: true,
    user: user.toJSON()
  });
});

router.get('/username/:username', (req, res) => {
  const username = req.params.username;
  const user = User.findByUsername(username);
  
  if (!user) {
    return res.json({
      success: false,
      message: 'User not found'
    });
  }
  
  return res.json({
    success: true,
    user: user.toJSON()
  });
});

module.exports = router;
