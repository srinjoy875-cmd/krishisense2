const express = require('express');
const router = express.Router();
const { registerDevice, listDevices } = require('../controllers/deviceController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', protect, registerDevice);
router.get('/list', protect, listDevices);

module.exports = router;
