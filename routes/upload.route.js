const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { uploadFile } = require("../controllers/upload.controller");

// Upload a single file to Cloudinary and return the URL
router.post("/", upload.single("file"), uploadFile);

module.exports = router;
