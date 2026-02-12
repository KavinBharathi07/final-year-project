import express from "express";
import { auth } from "../middleware/auth.js";
import { ServiceRequest } from "../models/ServiceRequest.js";
import { Provider } from "../models/Provider.js";

const router = express.Router();

export function createRequestRoutes(io) {
  // Create new service request (customer)
  router.post("/", auth(["CUSTOMER"]), async (req, res) => {
    const { category, description, lng, lat } = req.body;
    if (!category || lng == null || lat == null) {
      return res.status(400).json({ message: "category, lng, lat required" });
    }
    try {
      const request = await ServiceRequest.create({
        customerId: req.user._id,
        category,
        description,
        customerLocation: {
          type: "Point",
          coordinates: [Number(lng), Number(lat)]
        }
      });

      // Find nearest 5 providers
      const providers = await Provider.find({
        categories: category,
        verificationStatus: "APPROVED",
        availability: "AVAILABLE",
        isActive: true,
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [Number(lng), Number(lat)]
            },
            $maxDistance: 5000
          }
        }
      }).limit(5);

      const providerIds = providers.map((p) => p.userId.toString());
      // persist who was notified so we can tell the same providers when taken
      request.notifiedProviderUserIds = providerIds;
      await request.save();

      // Emit to each provider's personal room (they must have joined via join:provider)
      providerIds.forEach((userId) => {
        io.to(`provider_${userId}`).emit("request:new", {
          requestId: request._id.toString(),
          category,
          description,
          customerLocation: request.customerLocation
        });
      });
      console.log("[requests] New request", request._id, "notified providers:", providerIds);

      res.status(201).json({ request, notifiedProviders: providerIds.length });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Provider accepts request (atomic)
  router.post("/:id/accept", auth(["PROVIDER"]), async (req, res) => {
    try {
      const provider = await Provider.findOne({ userId: req.user._id });
      if (!provider || provider.verificationStatus !== "APPROVED") {
        return res.status(403).json({ message: "Provider not approved" });
      }

      const request = await ServiceRequest.findOneAndUpdate(
        {
          _id: req.params.id,
          status: "REQUEST_SENT",
          assignedProviderId: null
        },
        {
          $set: {
            assignedProviderId: provider._id,
            status: "ACCEPTED"
          }
        },
        { new: true }
      );

      if (!request) {
        return res.status(409).json({ message: "Request already taken" });
      }

      // Notify customer and other providers
      io.to(`request_${request._id}`).emit("request:accepted", {
        requestId: request._id.toString(),
        providerId: provider._id.toString()
      });
      // notify the same providers we originally notified (so they remove it)
      const notified = request.notifiedProviderUserIds || [];
      notified.forEach((userId) => {
        if (userId === req.user._id.toString()) return;
        io.to(`provider_${userId}`).emit("request:taken", { requestId: request._id.toString() });
      });

      res.json({ request });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Status updates
  router.post("/:id/status", auth(["PROVIDER"]), async (req, res) => {
    const { status } = req.body;
    try {
      const request = await ServiceRequest.findById(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      // Basic transition rules
      const allowed = [
        "ON_THE_WAY",
        "ARRIVED",
        "WORK_STARTED",
        "COMPLETION_REQUESTED"
      ];
      if (!allowed.includes(status)) {
        return res.status(400).json({ message: "Invalid status update" });
      }

      // only assigned provider can update after accept
      if (!request.assignedProviderId) {
        return res.status(400).json({ message: "Request not assigned yet" });
      }

      request.status = status;
      await request.save();
      io.to(`request_${request._id}`).emit("request:statusUpdate", {
        requestId: request._id.toString(),
        status
      });

      // Auto move ARRIVED -> WORK_STARTED after a few minutes if still ARRIVED
      if (status === "ARRIVED") {
        const requestId = request._id.toString();
        setTimeout(async () => {
          try {
            const fresh = await ServiceRequest.findById(requestId);
            if (!fresh) return;
            if (fresh.status !== "ARRIVED") return;
            fresh.status = "WORK_STARTED";
            await fresh.save();
            io.to(`request_${fresh._id}`).emit("request:statusUpdate", {
              requestId: fresh._id.toString(),
              status: "WORK_STARTED"
            });
          } catch {
            // ignore
          }
        }, 2 * 60 * 1000); // 2 minutes
      }
      res.json({ request });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Customer confirms completion after provider requests it
  router.post("/:id/confirm-completion", auth(["CUSTOMER"]), async (req, res) => {
    try {
      const request = await ServiceRequest.findById(req.params.id);
      if (!request) return res.status(404).json({ message: "Request not found" });
      if (request.customerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not your request" });
      }
      if (request.status !== "COMPLETION_REQUESTED") {
        return res.status(400).json({ message: "Completion not requested yet" });
      }
      request.status = "COMPLETED";
      await request.save();
      io.to(`request_${request._id}`).emit("request:statusUpdate", {
        requestId: request._id.toString(),
        status: "COMPLETED"
      });
      res.json({ request });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Payment confirm
  router.post("/:id/payment-confirm", auth(["PROVIDER"]), async (req, res) => {
    try {
      const request = await ServiceRequest.findById(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      if (request.status !== "COMPLETED") {
        return res.status(400).json({ message: "Customer must confirm completion first" });
      }
      request.status = "PAYMENT_CONFIRMED";
      await request.save();
      io.to(`request_${request._id}`).emit("request:statusUpdate", {
        requestId: request._id.toString(),
        status: "PAYMENT_CONFIRMED"
      });
      res.json({ request });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // List requests for logged-in customer (so they can see ongoing/past after re-login)
  router.get("/", auth(["CUSTOMER"]), async (req, res) => {
    try {
      const requests = await ServiceRequest.find({ customerId: req.user._id })
        .sort({ createdAt: -1 })
        .populate({ path: "assignedProviderId", populate: { path: "userId", select: "name" } })
        .lean();
      res.json({ requests });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get request by id (for tracking pages)
  router.get("/:id", auth(), async (req, res) => {
    try {
      const request = await ServiceRequest.findById(req.params.id)
        .populate("customerId")
        .populate({ path: "assignedProviderId", populate: { path: "userId" } });
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      res.json({ request });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  return router;
}

