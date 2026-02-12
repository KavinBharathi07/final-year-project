import mongoose from "mongoose";

const serviceRequestSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, required: true },
    description: { type: String },
    customerLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true
      }
    },
    status: {
      type: String,
      enum: [
        "REQUEST_SENT",
        "ACCEPTED",
        "ON_THE_WAY",
        "ARRIVED",
        "WORK_STARTED",
        "COMPLETION_REQUESTED",
        "COMPLETED",
        "PAYMENT_CONFIRMED"
      ],
      default: "REQUEST_SENT"
    },
    assignedProviderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      default: null
    }
    ,
    // used to notify the same set of providers when request is taken
    notifiedProviderUserIds: [{ type: String }]
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

serviceRequestSchema.index({ customerLocation: "2dsphere" });

export const ServiceRequest = mongoose.model("ServiceRequest", serviceRequestSchema);
