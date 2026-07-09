const multer = require('multer')
const path = require('path')
const { v4: uuidv4 } = require('uuid')

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'services')

const ALLOWED_IMAGE = ['.png', '.jpg', '.jpeg', '.webp']
const ALLOWED_DOC   = ['.pdf', '.doc', '.docx', '.xls', '.xlsx']

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`),
})

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase()
  if (file.fieldname === 'images' && !ALLOWED_IMAGE.includes(ext)) {
    return cb(new Error('Format image non supporté.'))
  }
  if (file.fieldname === 'documents' && !ALLOWED_DOC.includes(ext)) {
    return cb(new Error('Format document non supporté.'))
  }
  cb(null, true)
}

const uploadServiceFiles = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 11 },
}).fields([
  { name: 'images', maxCount: 6 },
  { name: 'documents', maxCount: 5 },
])

module.exports = { uploadServiceFiles }
