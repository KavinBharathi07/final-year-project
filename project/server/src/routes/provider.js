import express from "express";
import { auth } from "../middleware/auth.js";
import { Provider } from "../models/Provider.js";
import { ServiceRequest } from "../models/ServiceRequest.js";

const router = express.Router();

// Update availability (only if provider is APPROVED)
router.patch("/availability", auth(["PROVIDER"]), async (req, res) => {
  const { availability } = req.body;
  if (!["AVAILABLE", "OFFLINE", "BUSY"].includes(availability)) {
    return res.status(400).json({ message: "Invalid availability" });
  }
  try {
    const provider = await Provider.findOne({ userId: req.user._id });
    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found" });
    }
    if (provider.verificationStatus !== "APPROVED" && availability === "AVAILABLE") {
      return res.status(403).json({
        message: "Provider must be approved before going AVAILABLE",
        verificationStatus: provider.verificationStatus
      });
    }
    provider.availability = availability;
    await provider.save();
    res.json({ provider });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Nearby providers for customer map
router.get("/nearby", async (req, res) => {
  const { lng, lat, category } = req.query;
  if (!lng || !lat || !category) {
    return res.status(400).json({ message: "lng, lat, and category are required" });
  }
  try {
    const providers = await Provider.find({
      categories: category,
      verificationStatus: "APPROVED",
      availability: "AVAILABLE",
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)]
          },
          $maxDistance: 5000
        }
      }
    }).limit(20);
    res.json({ providers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Provider dashboard info
router.get("/me", auth(["PROVIDER"]), async (req, res) => {
  try {
    const provider = await Provider.findOne({ userId: req.user._id }).populate("userId");
    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found" });
    }
    res.json({ provider });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Open nearby requests for this provider (so they don't miss socket events)
router.get("/open-requests", auth(["PROVIDER"]), async (req, res) => {
  try {
    const provider = await Provider.findOne({ userId: req.user._id });
    if (!provider) return res.status(404).json({ message: "Provider profile not found" });
    if (provider.verificationStatus !== "APPROVED") {
      return res.status(403).json({ message: "Provider not approved" });
    }
    if (provider.availability !== "AVAILABLE") {
      return res.json({ requests: [] });
    }

    const requests = await ServiceRequest.find({
      status: "REQUEST_SENT",
      category: { $in: provider.categories },
      customerLocation: {
        $near: {
          $geometry: provider.location,
          $maxDistance: 5000
        }
      }
    })
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({ requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
