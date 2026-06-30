require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/product.model");

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to MongoDB.");

    const products = await Product.find({});
    console.log(`Found ${products.length} products to migrate.`);

    for (const product of products) {
      if (!product.slug) {
        // the pre-save hook will handle slug generation
        // just need to trigger save. But pre-save only runs if we call .save()
        // Wait, pre-save hook checks !this.slug, so it will generate it.
        await product.save();
        console.log(`Migrated: ${product.name} -> ${product.slug}`);
      } else {
        console.log(`Skipped: ${product.name} (already has slug: ${product.slug})`);
      }
    }

    console.log("Migration complete.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
