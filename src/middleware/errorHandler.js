// src/middleware/errorHandler.js
export default function errorHandler(err, res) {
    console.error(err);
    res.status(err.status || 500).json({
      message: err.message || 'Internal Server Error'
    });
  }
