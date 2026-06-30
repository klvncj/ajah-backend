const Banner = require("../models/banner.model");
const uploadToCloudinary = require("../utility/cloudinaryUpload");

// Create a new banner
exports.createBanner = async (req, res) => {
  try {
    const { title, subtitle, ctaText, ctaLink, isActive, order } = req.body;
    let imageUrl = req.body.image; // URL string from form field

    // If a file was uploaded, upload to Cloudinary and use the resulting URL
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      imageUrl = result.secure_url;
    }

    if (!imageUrl) {
      return res.status(400).json({ message: "Image is required (URL or file upload)" });
    }

    const banner = new Banner({
      image: imageUrl,
      title,
      subtitle,
      ctaText,
      ctaLink,
      isActive: isActive !== undefined ? isActive : true,
      order: order || 0,
    });

    await banner.save();
    res.status(201).json(banner);
  } catch (error) {
    res.status(400).json({ message: "Error creating banner", error: error.message });
  }
};

// Get all banners (for admin dashboard)
exports.getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ order: 1, createdAt: -1 });
    res.status(200).json(banners);
  } catch (error) {
    res.status(500).json({ message: "Error fetching banners", error: error.message });
  }
};

// Get active banners (for frontend store)
exports.getActiveBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    res.status(200).json(banners);
  } catch (error) {
    res.status(500).json({ message: "Error fetching active banners", error: error.message });
  }
};

// Get single banner by ID
exports.getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: "Banner not found" });
    res.status(200).json(banner);
  } catch (error) {
    res.status(500).json({ message: "Error fetching banner", error: error.message });
  }
};

// Update banner
exports.updateBanner = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // If a new file was uploaded, upload to Cloudinary
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      updateData.image = result.secure_url;
    }

    const banner = await Banner.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!banner) return res.status(404).json({ message: "Banner not found" });
    res.status(200).json(banner);
  } catch (error) {
    res.status(400).json({ message: "Error updating banner", error: error.message });
  }
};

// Delete banner
exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ message: "Banner not found" });
    res.status(200).json({ message: "Banner deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting banner", error: error.message });
  }
};
