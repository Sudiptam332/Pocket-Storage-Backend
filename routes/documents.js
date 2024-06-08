const express = require("express");
const router = express.Router();
const multer = require("multer");
const Doc = require("../models/Doc");
const fetchuser = require("../middleware/fetchuser");
const fs = require("fs");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Add Photo
router.post("/adddocs", fetchuser, upload.single("doc"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const doc = new Doc({
      userId: req.user.id,
      filename: req.body.filename,
      url: req.file.path,
    });
    await doc.save();
    res.json(doc);
  } catch (error) {
    console.error("Error while saving photo:", error.message);
    res.status(500).json({ error: "Server Error" });
  }
});

// Delete Photo
router.delete("/deletedocs/:id", fetchuser, async (req, res) => {
  try {
    let doc = await Doc.findById(req.params.id);
    if (!doc) return res.status(404).json({ msg: "Doc not found" });

    if (doc.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    doc = await Doc.findByIdAndDelete(req.params.id);
    res.json({ Success: "Doc has been deleted.", doc: doc });

    // Optionally, delete the file from the filesystem
    fs.unlink(path.join(__dirname, "..", doc.url), (err) => {
      if (err) console.error("Error while deleting file:", err.message);
    });
  } catch (error) {
    console.error("Error while deleting photo:", error.message);
    res.status(500).json({ error: "Server Error" });
  }
});

// Fetch Photos
router.get("/fetchdocs", fetchuser, async (req, res) => {
  try {
    const docs = await Doc.find({ userId: req.user.id });
    res.json(docs);
  } catch (error) {
    console.error("Error while fetching photos:", error.message);
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;
