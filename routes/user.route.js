const express = require("express");
const router = require("express").Router();
const userController = require("../controllers/user.controller");

// Route to create a new user
router.post("/", userController.createUser);
// Route to get user details by ID
router.get("/detail/:id", userController.getUserDetails);
// Route to update user details by ID
router.put("/update/:id", userController.updateUser);
//Route to delete user by ID
router.delete("/delete/:id", userController.deleteUser);
// Route to get all users
router.get("/", userController.getAllUsers);
// Route to get latest registered users
router.get("/latest", userController.getLatestUsers);
// Route to check if user has delivery details
router.get("/delivery-details/:id", userController.hasDeliveryDetails);
// Route to Check User existence by Id 
router.get("/exists/:id", userController.isUser);


module.exports = router;
