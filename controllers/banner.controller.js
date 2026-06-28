const Banner = require("../models/banner.model");

// Create a new banner
exports.createBanner = async (req, res) => {
  try {
    const banner = new Banner(req.body);
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
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
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
