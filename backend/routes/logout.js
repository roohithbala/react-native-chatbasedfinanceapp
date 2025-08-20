const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    // In a real implementation, you might want to blacklist the token
    // or update the user's session status in the database
    // For now, we'll just send a success response since the client
    // will remove the token
    res.status(200).json({ message: 'Successfully logged out' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Error during logout' });
  }
});

module.exports = router;
