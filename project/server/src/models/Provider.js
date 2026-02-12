import mongoose from "mongoose";

const providerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    categories: [{ type: String, required: true }],
    profileImage: { type: String, required: true },
    documents: {
      idProofUrl: { type: String, required: true },
      optionalCertUrl: { type: String }
    },
    verificationStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING"
    },
    verificationNotes: { type: String },
    verifiedAt: { type: Date },
    isActive: { type: Boolean, default: true },
    availability: {
      type: String,
      enum: ["AVAILABLE", "OFFLINE", "BUSY"],
      default: "OFFLINE"
    },
    location: {
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
    address: { type: String, required: true }
  },
  { timestamps: true }
);

providerSchema.index({ location: "2dsphere" });

export const Provider = mongoose.model("Provider", providerSchema);
