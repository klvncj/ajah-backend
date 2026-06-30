const uploadToCloudinary = require("../utility/cloudinaryUpload");

// Generic file upload endpoint — uploads a single file to Cloudinary and returns the URL
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const result = await uploadToCloudinary(req.file.buffer);
    res.status(200).json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    res.status(500).json({ message: "Error uploading file", error: error.message });
  }
};
