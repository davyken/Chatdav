import { Router } from "express";
import { protectRoute } from "../middleware/auth";
import { getMessages, uploadFile } from "../controllers/messageController";
import multer from "multer";

const router = Router();

// Configure multer for memory storage (we upload to Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Upload route - note the order: multer runs first, then protectRoute
router.post("/upload", upload.single("file"), protectRoute, uploadFile);
router.get("/chat/:chatId", protectRoute, getMessages);

export default router;
