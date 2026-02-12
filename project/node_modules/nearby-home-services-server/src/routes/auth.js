import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { User } from "../models/User.js";
import { Provider } from "../models/Provider.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

// Customer or provider registration
router.post(
  "/register",
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "idProof", maxCount: 1 },
    { name: "optionalCert", maxCount: 1 }
  ]),
  [
    body("name").notEmpty(),
    body("email").isEmail(),
    body("phone").notEmpty(),
    body("password").isLength({ min: 6 }),
    body("role").isIn(["CUSTOMER", "PROVIDER"])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, password, role } = req.body;

    try {
      const existing = await User.findOne({ email });
      if (existing) {
        // If an existing Service Provider was recently rejected, block re-registration for 24 hours
        if (existing.role === "PROVIDER") {
          const existingProvider = await Provider.findOne({ userId: existing._id });
          if (
            existingProvider &&
            existingProvider.verificationStatus === "REJECTED" &&
            existingProvider.verifiedAt
          ) {
            const now = Date.now();
            const rejectedAt = existingProvider.verifiedAt.getTime();
            const hours24 = 24 * 60 * 60 * 1000;
            if (now - rejectedAt < hours24) {
              return res.status(400).json({
                message: "Your registration was rejected. You can reapply after 24 hours."
              });
            }
          }
        }
        return res.status(400).json({ message: "Email already registered" });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await User.create({
        name,
        email,
        phone,
        passwordHash,
        role
      });

      // If provider, create Provider profile with required fields
      if (role === "PROVIDER") {
        const {
          categories,
          lng,
          lat,
          address
        } = req.body;

        if (!req.files.profileImage || !req.files.idProof) {
          return res.status(400).json({ message: "Profile image and ID proof are required" });
        }

        const profileImage = `/uploads/${req.files.profileImage[0].filename}`;
        const idProofUrl = `/uploads/${req.files.idProof[0].filename}`;
        const optionalCertUrl = req.files.optionalCert
          ? `/uploads/${req.files.optionalCert[0].filename}`
          : undefined;

        const categoriesArray = Array.isArray(categories)
          ? categories
          : typeof categories === "string"
          ? categories.split(",").map((c) => c.trim())
          : [];

        await Provider.create({
          userId: user._id,
          categories: categoriesArray,
          profileImage,
          documents: {
            idProofUrl,
            optionalCertUrl
          },
          location: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)]
          },
          address
        });
      }

      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: "7d"
      });

      res.status(201).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.post(
  "/login",
  [body("email").isEmail(), body("password").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: "7d"
      });
      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
