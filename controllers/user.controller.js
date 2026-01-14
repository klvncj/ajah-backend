const UserModel = require("../models/user.model");
const bcrypt = require("bcryptjs");

// Example controller function to create a new user
exports.createUser = async (req, res) => {
  try {
    const {
      firstname,
      lastname,
      email,
      phone,
      password,
      country,
      state,
      address,
    } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new UserModel({
      firstname,
      lastname,
      email,
      phone,
      password: hashedPassword,
      country,
      state,
      address,
    });
    const savedUser = await newUser.save();
    res
      .status(201)
      .json({ message: "User created successfully", userId: savedUser._id });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating user", error: error.message });
  }
};

// Example controller function to get user details
exports.getUserDetails = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await UserModel.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching user details", error: error.message });
  }
};

// Example controller function to update user details
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;
    const updatedUser = await UserModel.findByIdAndUpdate(userId, updates, {
      new: true,
    }).select("-password");
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res
      .status(200)
      .json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating user", error: error.message });
  }
};

// Example controller function to delete a user
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const deletedUser = await UserModel.findByIdAndDelete(userId).select(
      "-password"
    );
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res
      .status(200)
      .json({ message: "User deleted successfully", user: deletedUser });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting user", error: error.message });
  }
};

// Example controller to get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
};

//controller function to get latest 20 users
exports.getLatestUsers = async (req, res) => {
  try {
    const users = await UserModel.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .select("-password");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching latest users",
      error: error.message,
    });
  }
};

// Controller function to get paginated users
exports.getUsersPaginated = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const users = await UserModel.find().skip(skip).limit(limit).select("-password");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching paginated users",
      error: error.message,
    });
  }
};
