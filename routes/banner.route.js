const express = require("express");
const router = express.Router();
const bannerController = require("../controllers/banner.controller");

// Route to get active banners (public)
router.get("/active", bannerController.getActiveBanners);

// Admin routes
router.get("/", bannerController.getAllBanners);
router.post("/", bannerController.createBanner);
router.get("/:id", bannerController.getBannerById);
router.put("/:id", bannerController.updateBanner);
router.delete("/:id", bannerController.deleteBanner);

module.exports = router;
