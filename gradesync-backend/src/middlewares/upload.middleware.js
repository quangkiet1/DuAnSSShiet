/**
 * Upload Middleware - Multer configuration for Excel files
 * Security: only allows Excel files and keeps them in memory for processing.
 */
const multer = require('multer');
const path = require('path');

const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10);

// Allowed MIME types for Excel
const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel.sheet.macroEnabled.12', // .xlsm
  'application/vnd.ms-excel', // .xls (legacy)
];
const ALLOWED_EXTENSIONS = ['.xlsx', '.xlsm', '.xls'];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error(`Chỉ cho phép file Excel (.xlsx, .xlsm, .xls). File của bạn: ${file.originalname}`));
  }
  // Note: MIME type can be unreliable on some OS, so we primarily check extension
  // but also check MIME when available
  if (!ALLOWED_MIME_TYPES.includes(mime) && mime !== 'application/octet-stream') {
    // Allow octet-stream as fallback (some browsers send this)
    console.warn(`[UPLOAD] MIME type ${mime} for ${file.originalname} - allowed by extension check`);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 2,
  },
});

module.exports = { upload };
