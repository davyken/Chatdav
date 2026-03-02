import { Router } from "express";
import { protectRoute } from "../middleware/auth";
import { getUsers } from "../controllers/userController";
import { User } from "../models/User";

const router = Router();

router.get("/", protectRoute, getUsers);

// Debug endpoint to check users in database (no auth required)
router.get("/debug", async (req, res) => {
  try {
    const users = await User.find({}).limit(10);
    res.json({ count: users.length, users });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

export default router;
