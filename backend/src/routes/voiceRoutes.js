const express = require('express');
const router = express.Router();
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { processVoiceCommand } = require('../controllers/voiceController');
const { findUserById } = require('../services/dataService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const optionalProtect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'wattstop_dev_secret_key_8b9ee45_2026');
      req.user = await findUserById(decoded.id);
    } catch (e) {
      // Ignore token verification failure for optional protection
    }
  }
  next();
};

router.post('/process', upload.single('audio'), optionalProtect, processVoiceCommand);

module.exports = router;
