const UserModel = require("../models/user.model");
const bcrypt = require("bcryptjs");


exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await UserModel.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Authentication Failed" });
    }

    return res
      .status(200)
      .json({ user, message: "Authentication sucessful" });
  } catch (error) {
    res.status(500).json({ error });
  }
};

exports.authAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await UserModel.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Authentication Failed" });
    }
    if (user.role !== "admin") {
      return res.status(401).json({ message: "Authentication Failed" });
    }
    return res
      .status(200)
      .json({ user, message: "Authentication sucessful" });
  } catch (error) {
    res.status(500).json({ error });
  }
};