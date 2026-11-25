// ─── Global error handler middleware ─────────────────────────────────────────
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Multer: file too large
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'Image file size is too large. Maximum allowed size is 15MB.' });
  }

  // Multer: wrong file type
  if (err.message && err.message.includes('Only image files')) {
    return res.status(400).json({ success: false, message: err.message });
  }

  // MySQL: duplicate entry  (ER_DUP_ENTRY)
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({
      success: false,
      message: 'A record with this value already exists.'
    });
  }

  // MySQL: foreign key violation
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist.'
    });
  }

  // MySQL: data too long
  if (err.code === 'ER_DATA_TOO_LONG') {
    return res.status(400).json({
      success: false,
      message: 'Input value is too long for one of the fields.'
    });
  }

  // Default
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
