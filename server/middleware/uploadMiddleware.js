
const multer = require("multer");

// Store uploaded files temporarily in memory
const storage = multer.memoryStorage();



// Validate uploaded files
const fileFilter = (req, file, cb) => {

  const isPdfExtension = file.originalname
    .toLowerCase()
    .endsWith(".pdf");

  const isPdfMimeType =
    file.mimetype === "application/pdf" ||
    file.mimetype === "application/octet-stream";

  if (isPdfExtension && isPdfMimeType) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed!"), false);
  }
};


// Configure Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB maximum
  },
});

module.exports = upload;
