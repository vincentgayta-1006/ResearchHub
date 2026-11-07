const upload = require("../middleware/uploadMiddleware");
const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");
const express = require("express");
const Research = require("../models/Research");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();



 // GET ALL RESEARCH PAPERS WITH SEARCH, FILTERING, AND PAGINATION
router.get("/", async (req, res) => {
  try {
    const { search, category, year } = req.query;

    // Pagination defaults
    const page = req.query.page === undefined
      ? 1
      : Number(req.query.page);

    const limit = req.query.limit === undefined
      ? 10
      : Number(req.query.limit);

    // Validate pagination
    if (
      !Number.isInteger(page) ||
      !Number.isInteger(limit) ||
      page < 1 ||
      limit < 1 ||
      limit > 50
    ) {
      return res.status(400).json({
        message: "Invalid pagination. Page must be positive and limit must be between 1 and 50.",
      });
    }

    // Build MongoDB query
    const filter = {};

    // Keyword search
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { authors: { $regex: search, $options: "i" } },
        { abstract: { $regex: search, $options: "i" } },
        { keywords: { $regex: search, $options: "i" } },
      ];
    }

    // Category filter
    if (category) {
      filter.category = {
        $regex: `^${category}$`,
        $options: "i",
      };
    }

    // Year filter
    if (year) {
      const parsedYear = Number(year);

      if (!Number.isInteger(parsedYear)) {
        return res.status(400).json({
          message: "Invalid year. Please provide a valid year.",
        });
      }

      filter.year = parsedYear;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Retrieve research papers and total matching records
    const [research, totalCount] = await Promise.all([
      Research.find(filter)
        .populate("uploadedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Research.countDocuments(filter),
    ]);

    res.status(200).json({
      message: "Research papers retrieved successfully!",
      count: research.length,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      limit,
      research,
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve research papers.",
      error: error.message,
    });
  }
});



// CREATE RESEARCH PAPER WITH PDF UPLOAD (ADMIN ONLY)
router.post(
  "/",
  authMiddleware,

  // Check admin role before accepting the file
  (req, res, next) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admins only.",
      });
    }
    next();
  },

  upload.single("pdf"),

  async (req, res) => {
    let uploadedPdf;

    try {
      // Check if PDF was provided
      if (!req.file) {
        return res.status(400).json({
          message: "Please upload a PDF file.",
        });
      }

      // Convert authors and keywords into arrays
      const parseArray = (value) => {
        if (!value) return [];

        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [value];
        } catch {
          return value.split(",").map(item => item.trim()).filter(Boolean);
        }
      };

      // Prepare a safe filename
      const fileName = req.file.originalname
        .replace(/\.pdf$/i, "")
        .replace(/[^a-zA-Z0-9_-]/g, "-");

      const publicId = `${Date.now()}-${fileName}.pdf`;

      // Upload PDF to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: "raw",
            folder: "researchhub/pdfs",
            public_id: publicId,
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );

        Readable.from(req.file.buffer).pipe(stream);
      });

      uploadedPdf = result;

      // Save research information in MongoDB
      const research = await Research.create({
        title: req.body.title,
        authors: parseArray(req.body.authors),
        abstract: req.body.abstract,
        category: req.body.category,
        keywords: parseArray(req.body.keywords),
        year: Number(req.body.year),
        pdfUrl: result.secure_url,
        pdfPublicId: result.public_id,
        uploadedBy: req.user.id,
      });

      res.status(201).json({
        message: "Research paper uploaded successfully!",
        research,
      });

    } catch (error) {
      // Remove uploaded PDF if database creation fails
      if (uploadedPdf) {
        await cloudinary.uploader.destroy(
          uploadedPdf.public_id,
          { resource_type: "raw" }
        ).catch(() => {});
      }

      res.status(500).json({
        message: "Failed to upload research paper.",
        error: error.message,
      });
    }
  }
);


// GET SINGLE RESEARCH PAPER
router.get("/:id", async (req, res) => {
  try {
    const research = await Research.findById(req.params.id)
      .populate("uploadedBy", "name email");

    if (!research) {
      return res.status(404).json({
        message: "Research paper not found.",
      });
    }

    res.status(200).json({
      message: "Research paper retrieved successfully!",
      research,
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve research paper.",
      error: error.message,
    });
  }
});


// UPDATE RESEARCH PAPER (ADMIN ONLY)

// UPDATE RESEARCH PAPER (ADMIN ONLY)
router.put(
  "/:id",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admins only.",
      });
    }

    next();
  },
  upload.single("pdf"),
  async (req, res) => {
    let uploadedPdf;
    let databaseUpdated = false;

    try {
      const research = await Research.findById(req.params.id);

      if (!research) {
        return res.status(404).json({
          message: "Research paper not found.",
        });
      }

      // Preserve the old PDF information
      const oldPdfPublicId = research.pdfPublicId;

      const parseArray = (value) => {
        if (value === undefined) return undefined;

        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [value];
        } catch {
          return value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        }
      };

      // Update metadata only when provided
      if (req.body.title !== undefined) {
        research.title = req.body.title;
      }

      if (req.body.authors !== undefined) {
        research.authors = parseArray(req.body.authors);
      }

      if (req.body.abstract !== undefined) {
        research.abstract = req.body.abstract;
      }

      if (req.body.category !== undefined) {
        research.category = req.body.category;
      }

      if (req.body.keywords !== undefined) {
        research.keywords = parseArray(req.body.keywords);
      }

      if (req.body.year !== undefined) {
        research.year = Number(req.body.year);
      }

      // Upload replacement PDF if provided
      if (req.file) {
        const fileName = req.file.originalname
          .replace(/\.pdf$/i, "")
          .replace(/[^a-zA-Z0-9_-]/g, "-");

        const publicId = `${Date.now()}-${fileName}.pdf`;

        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              resource_type: "raw",
              folder: "researchhub/pdfs",
              public_id: publicId,
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );

          Readable.from(req.file.buffer).pipe(stream);
        });

        uploadedPdf = result;

        research.pdfUrl = result.secure_url;
        research.pdfPublicId = result.public_id;
      }

      // Save updated research record
      await research.save();
      databaseUpdated = true;

      // Delete old PDF after successful database update
      if (
        uploadedPdf &&
        oldPdfPublicId &&
        oldPdfPublicId !== uploadedPdf.public_id
      ) {
        try {
          await cloudinary.uploader.destroy(
            oldPdfPublicId,
            {
              resource_type: "raw",
              invalidate: true,
            }
          );
        } catch (deleteError) {
          console.error("Old PDF deletion failed:", deleteError.message);
        }
      }

      res.status(200).json({
        message: "Research paper updated successfully!",
        research,
      });

    } catch (error) {
      // Delete new PDF only if database update failed
      if (uploadedPdf && !databaseUpdated) {
        await cloudinary.uploader.destroy(
          uploadedPdf.public_id,
          { resource_type: "raw" }
        ).catch(() => {});
      }

      res.status(500).json({
        message: "Failed to update research paper.",
        error: error.message,
      });
    }
  }
);


 // DELETE RESEARCH PAPER AND ITS PDF (ADMIN ONLY)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admins only.",
      });
    }

    // Find research paper first
    const research = await Research.findById(req.params.id);

    if (!research) {
      return res.status(404).json({
        message: "Research paper not found.",
      });
    }

    // Delete PDF from Cloudinary if it exists
    if (research.pdfPublicId) {
      const result = await cloudinary.uploader.destroy(
        research.pdfPublicId,
        {
          resource_type: "raw",
          invalidate: true,
        }
      );

      if (result.result !== "ok" && result.result !== "not found") {
        return res.status(500).json({
          message: "Failed to delete PDF from Cloudinary.",
        });
      }
    }

    // Delete research record from MongoDB
    await Research.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Research paper and PDF deleted successfully!",
      research,
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to delete research paper.",
      error: error.message,
    });
  }
});


module.exports = router;
