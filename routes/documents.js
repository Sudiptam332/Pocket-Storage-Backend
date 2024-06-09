const express = require("express");
const router = express.Router();
const multer = require("multer");
const { bucket } = require("../firebase");
const Doc = require("../models/Doc");
const fetchuser = require("../middleware/fetchuser");
const path = require("path");

// Configure multer storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Add Document
router.post("/adddocs", fetchuser, upload.single("doc"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const blob = bucket.file(Date.now() + "-" + req.file.originalname);
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    blobStream.on("error", (err) => {
      console.error("Error while uploading to Firebase:", err.message);
      res.status(500).json({ error: "Server Error" });
    });

    blobStream.on("finish", async () => {
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/pocketstorage-dcbcb.appspot.com/o/${blob.name}?alt=media`;
      const doc = new Doc({
        userId: req.user.id,
        filename: req.body.filename,
        url: publicUrl, // Store Firebase URL
      });
      await doc.save();
      res.json(doc);
    });

    blobStream.end(req.file.buffer);
  } catch (error) {
    console.error("Error while saving document:", error.message);
    res.status(500).json({ error: "Server Error" });
  }
});

// Delete Document
router.delete("/deletedocs/:id", fetchuser, async (req, res) => {
  try {
    let doc = await Doc.findById(req.params.id);
    if (!doc) return res.status(404).json({ msg: "Document not found" });

    if (doc.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    doc = await Doc.findByIdAndDelete(req.params.id);
    res.json({ Success: "Document has been deleted.", doc: doc });
  } catch (error) {
    console.error("Error while deleting document:", error.message);
    res.status(500).json({ error: "Server Error" });
  }
});

// Fetch Documents
router.get("/fetchdocs", fetchuser, async (req, res) => {
  try {
    const docs = await Doc.find({ userId: req.user.id });
    res.json(docs);
  } catch (error) {
    console.error("Error while fetching documents:", error.message);
    res.status(500).json({ error: "Server Error" });
  }
});

// Define route to download a PDF file
router.get("/download/:filename", (req, res) => {
  try {
    // Get the filename from request parameters
    const filename = req.params.filename;

    // Generate the file URL
    const file = bucket.file(filename);
    const fileUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;

    res.redirect(fileUrl);
  } catch (error) {
    console.error("Error while downloading file:", error.message);
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;
