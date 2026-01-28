const express = require("express");
const router = express.Router();
const { createStore, getStoreById, updateStore, deleteStore, getStore } = require("../controllers/store.controller");

router.post("/", createStore);
router.get("/:id", getStoreById);
router.put("/:id", updateStore);
router.delete("/:id", deleteStore);
router.get("/", getStore);

module.exports = router;