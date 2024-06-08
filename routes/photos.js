const express = require("express");
const router = express.Router();
const multer = require("multer");
const Photo = require("../models/Photo");
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
router.post(
  "/addphoto",
  fetchuser,
  upload.single("photo"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const photo = new Photo({
        userId: req.user.id,
        url: req.file.path,
        description: req.body.description,
      });
      await photo.save();
      res.json(photo);
    } catch (error) {
      console.error("Error while saving photo:", error.message);
      res.status(500).json({ error: "Server Error" });
    }
  }
);

// Delete Photo
router.delete("/deletephoto/:id", fetchuser, async (req, res) => {
  try {
    let photo = await Photo.findById(req.params.id);
    if (!photo) return res.status(404).json({ msg: "Photo not found" });

    if (photo.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    photo = await Photo.findByIdAndDelete(req.params.id);
    res.json({ Success: "Photo has been deleted.", photo: photo });

    // Optionally, delete the file from the filesystem
    fs.unlink(path.join(__dirname, "..", photo.url), (err) => {
      if (err) console.error("Error while deleting file:", err.message);
    });

    res.json({ msg: "Photo removed" });
  } catch (error) {
    console.error("Error while deleting photo:", error.message);
    res.status(500).json({ error: "Server Error" });
  }
});

// Fetch Photos
router.get("/fetchphotos", fetchuser, async (req, res) => {
  try {
    const photos = await Photo.find({ userId: req.user.id });
    res.json(photos);
  } catch (error) {
    console.error("Error while fetching photos:", error.message);
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;
