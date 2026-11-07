
const mongoose = require("mongoose");

const researchSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    authors: {
      type: [String],
      required: true,
    },

    abstract: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    keywords: {
      type: [String],
      default: [],
    },

    year: {
      type: Number,
      required: true,
    },

    pdfUrl: {
      type: String,
      required: true,
    },

    pdfPublicId: {
      type: String,
      required: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Research = mongoose.model("Research", researchSchema);

module.exports = Research;
