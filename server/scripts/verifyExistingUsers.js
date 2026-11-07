
require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");

const verifyExistingUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to MongoDB.");

    // Mark only legacy accounts without isVerified as verified
    const result = await User.updateMany(
      { isVerified: { $exists: false } },
      { $set: { isVerified: true } }
    );

    console.log(`Updated ${result.modifiedCount} existing accounts.`);
  } catch (error) {
    console.error("Migration failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB connection closed.");
  }
};

verifyExistingUsers();
