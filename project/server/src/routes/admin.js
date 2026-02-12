import express from "express";
import { auth } from "../middleware/auth.js";
import { Provider } from "../models/Provider.js";
import { ServiceRequest } from "../models/ServiceRequest.js";

const router = express.Router();

// List all providers
router.get("/providers", auth(["ADMIN"]), async (req, res) => {
  try {
    const providers = await Provider.find().populate("userId");
    res.json({ providers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Approve provider
router.post("/provider/:id/approve", auth(["ADMIN"]), async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }
    provider.verificationStatus = "APPROVED";
    provider.verificationNotes = req.body.notes || "";
    provider.verifiedAt = new Date();
    await provider.save();
    res.json({ provider });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Reject provider
router.post("/provider/:id/reject", auth(["ADMIN"]), async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }
    provider.verificationStatus = "REJECTED";
    provider.verificationNotes = req.body.reason || "Rejected";
    provider.verifiedAt = new Date();
    await provider.save();
    res.json({ provider });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Deactivate provider
router.post("/provider/:id/deactivate", auth(["ADMIN"]), async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }
    provider.isActive = false;
    provider.availability = "OFFLINE";
    await provider.save();
    res.json({ provider });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Requests list (all requests for admin)
router.get("/requests", auth(["ADMIN"]), async (req, res) => {
  try {
    const requests = await ServiceRequest.find()
      .sort({ createdAt: -1 })
      .populate("customerId", "name email phone")
      .populate({
        path: "assignedProviderId",
        populate: { path: "userId", select: "name email phone" }
      })
      .lean();
    res.json({ requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
