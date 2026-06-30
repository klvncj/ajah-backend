const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  slug: {
    type: String,
    unique: true,
    index: true
  },
  images: {
    type: [String], // array of image URLs
    default: []
  },
  stock: {
    type: Number,
    default: 0
  },
  unit: {
    type: String,
    default: "pcs"
  },
  variations: {
    type: [String], // could be array of objects (e.g., color, size)
    default: []
  },
  shortDescription: {
    type: String,
    maxlength: 200
  },
  description: {
    type: String
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true
  },
  status: {
    type: String,
    enum: ["active", "inactive", "archived"],
    default: "active"
  },
  sizeChart: {
    type: String // could be a URL or text reference
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const slugify = require("slugify");

productSchema.pre("save", async function() {
  if (this.isModified("name") || !this.slug) {
    let baseSlug = slugify(this.name, { lower: true, strict: true });
    let uniqueSlug = baseSlug;
    let counter = 1;
    
    // Check for uniqueness
    while (true) {
      const existingProduct = await this.constructor.findOne({ slug: uniqueSlug, _id: { $ne: this._id } });
      if (!existingProduct) break;
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = uniqueSlug;
  }
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;