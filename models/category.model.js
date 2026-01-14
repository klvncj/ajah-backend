const mongoose =  require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
      minlength: [3, "Category name must be at least 3 characters"],
      maxlength: [50, "Category name must be at most 50 characters"],
    },
    description: {
      type: String,
      maxlength: [500, "Description must be at most 500 characters"],
      default: "",
      trim: true,
    },
    url: {
      type: String,
      default: "",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// export const Category = model("Category", categorySchema);
module.exports = mongoose.model("Category", categorySchema);
