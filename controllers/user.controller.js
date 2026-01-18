const UserModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const sendEmail = require("../utility/mailer");

// Example controller function to create a new user - working version
// exports.createUser = async (req, res) => {
//   try {
//     const { firstname, lastname, email, password, phone } = req.body;

//     // Validate required fields
//     if (!firstname || !lastname || !email || !password) {
//       return res
//         .status(400)
//         .json({ message: "All required fields must be provided" });
//     }

//     const emailExists = await UserModel.findOne({ email });
//     if (emailExists) {
//       return res.status(400).json({ message: "Email already exists" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const user = await UserModel.create({
//       firstname,
//       lastname,
//       email,
//       password: hashedPassword,
//       phone, // optional
//     });

//     res.status(201).json({
//       message: "User created successfully",
//       userId: user._id,
//     });

//     await sendEmail({
//       to: email,
//       subject: "Welcome to Our Store",
//       text: `Hi ${firstname},\n\nYour account has been created successfully! You can now login and start shopping.\n\nThanks.`,
//       html: `
//   <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.5; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
//     <h2 style="color: #2a9d8f;">Welcome to Our Store, ${firstname}!</h2>
//     <p>We are thrilled to have you on board. Your account has been successfully created.</p>
//     <p style="margin-top: 20px;">You can now log in and start shopping:</p>
//     <a href="https://yourstore.com/login" style="display: inline-block; padding: 10px 20px; background-color: #2a9d8f; color: #fff; text-decoration: none; border-radius: 4px; margin-top: 10px;">Login Now</a>
//     <p style="margin-top: 30px; font-size: 0.9em; color: #666;">
//       If you did not sign up for this account, please ignore this email.
//     </p>
//     <hr style="margin: 20px 0; border: 0; border-top: 1px solid #e0e0e0;">
//     <p style="font-size: 0.8em; color: #999;">© 2026 Your Store. All rights reserved.</p>
//   </div>
//   `,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error creating user",
//       error: error.message,
//     });
//   }
// };

// Revised controller function to create a new user
exports.createUser = async (req, res) => {
  try {
    const { firstname, lastname, email, password, phone } = req.body;

    if (!firstname || !lastname || !email || !password) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided" });
    }

    const emailExists = await UserModel.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await UserModel.create({
      firstname,
      lastname,
      email,
      password: hashedPassword,
      phone,
    });

    // Send response immediately
    res.status(201).json({
      message: "User created successfully",
      userId: user._id,
    });

    // Send email asynchronously (fire-and-forget)
    sendEmail({
      to: email,
      subject: "Welcome to Our Store",
      text: `Hi ${firstname},\n\nYour account has been created successfully! You can now login and start shopping.\n\nThanks.`,
     html: `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; max-width: 600px; margin: 40px auto; padding: 0; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid #e0e0e0;">
  <div style="background-color: #2a9d8f; color: #fff; padding: 30px 20px; text-align: center;">
    <h1 style="margin: 0; font-size: 28px;">Welcome, ${firstname}!</h1>
  </div>
  <div style="padding: 30px 20px; background-color: #fff;">
    <p style="font-size: 16px; margin: 0 0 15px;">We’re excited to have you on board. Your account has been successfully created.</p>
    <p style="font-size: 16px; margin: 0 0 25px;">Click the button below to log in and start shopping:</p>
    <div style="text-align: center;">
      <a href="https://yourstore.com/login" style="display: inline-block; padding: 12px 25px; background-color: #e76f51; color: #fff; text-decoration: none; font-weight: bold; border-radius: 5px;">Login Now</a>
    </div>
    <p style="margin-top: 30px; font-size: 13px; color: #666;">If you did not sign up for this account, please ignore this email.</p>
  </div>
  <div style="background-color: #f4f4f4; text-align: center; padding: 15px 20px; font-size: 12px; color: #999;">
    © 2026 Your Store. All rights reserved.
  </div>
</div>
`

    }).catch((err) => console.error("Error sending welcome email:", err));
  } catch (error) {
    res.status(500).json({
      message: "Error creating user",
      error: error.message,
    });
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
    const deletedUser =
      await UserModel.findByIdAndDelete(userId).select("-password");
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
    const users = await UserModel.find()
      .skip(skip)
      .limit(limit)
      .select("-password");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching paginated users",
      error: error.message,
    });
  }
};

exports.hasDeliveryDetails = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hasDetails = Boolean(
      user.country?.trim() && user.state?.trim() && user.address?.trim(),
    );

    res.status(200).json({ hasDeliveryDetails: hasDetails });
  } catch (error) {
    res.status(500).json({
      message: "Error checking delivery details",
      error: error.message,
    });
  }
};

exports.isUser = async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ isUser: true });
  } catch (error) {
    res.status(500).json({
      message: "Error checking user role",
      error: error.message,
    });
  }
};

exports.UpdateDeliveryDetails = async (req, res) => {
  try {
    const userId = req.params.id;
    const { country, state, address } = req.body;
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { country, state, address },
      { new: true },
    ).select("-password");
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
      message: "Delivery details updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating delivery details",
      error: error.message,
    });
  }
};
