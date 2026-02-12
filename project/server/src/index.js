import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import providerRoutes from "./routes/provider.js";
import adminRoutes from "./routes/admin.js";
import { createRequestRoutes } from "./routes/requests.js";
import { auth } from "./middleware/auth.js";
import { User } from "./models/User.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PATCH"]
  }
});

// Socket.IO auth and rooms
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("_id role");
    if (user) {
      socket.data.userId = user._id.toString();
      socket.data.role = user.role;
    }
    next();
  } catch (err) {
    console.error("Socket auth error", err);
    next(); // allow connection, but without auto-rooms
  }
});

io.on("connection", (socket) => {
  console.log("Socket connected", socket.id);

  // Auto-join provider room based on JWT (more reliable)
  if (socket.data?.role === "PROVIDER" && socket.data?.userId) {
    const room = `provider_${socket.data.userId}`;
    socket.join(room);
    console.log("[socket] Auto-joined provider room", room);
  }

  socket.on("join:provider", (userId) => {
    const room = `provider_${userId}`;
    socket.join(room);
    console.log("[socket] Provider joined room", room);
  });

  socket.on("join:request", (requestId) => {
    socket.join(`request_${requestId}`);
  });

  socket.on("provider:locationUpdate", ({ requestId, coords }) => {
    io.to(`request_${requestId}`).emit("provider:locationUpdate", { requestId, coords });
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected", socket.id);
  });
});

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173"
  })
);
app.use(express.json());
app.use(morgan("dev"));

// Static uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/provider", providerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/requests", createRequestRoutes(io));

// Simple current user endpoint
app.get("/api/me", auth(), (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
});

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDB(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/nearby-home-services");
  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

start();

