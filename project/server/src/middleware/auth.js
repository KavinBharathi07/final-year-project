import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export function auth(requiredRoles = []) {
  return async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing authorization token" });
    }
    const token = header.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      if (requiredRoles.length && !requiredRoles.includes(user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      req.user = user;
      next();
    } catch (err) {
      console.error(err);
      return res.status(401).json({ message: "Invalid token" });
    }
  };
}
