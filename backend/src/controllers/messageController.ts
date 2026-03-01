import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/auth";
import { Message } from "../models/Message";
import { Chat } from "../models/Chat";
import { User } from "../models/User";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import streamifier from "streamifier";

// Configure Cloudinary
cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL,
});

export async function getMessages(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    const { chatId } = req.params;

    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId,
    });

    if (!chat) {
      res.status(404).json({ message: "Chat not found" });
      return;
    }

    const messages = await Message.find({ chat: chatId })
      .populate("sender", "name email avatar")
      .sort({ createdAt: 1 }); // oldest first

    res.json(messages);
  } catch (error) {
    res.status(500);
    next(error);
  }
}

export async function uploadFile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    console.log("[Upload] Request received");
    console.log("[Upload] Content-Type:", req.headers["content-type"]);
    console.log("[Upload] req.file:", req.file);
    console.log("[Upload] req.body:", req.body);
    
    const userId = req.userId;
    const { chatId } = req.body;

    if (!req.file) {
      console.log("[Upload] No file in request");
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    if (!chatId) {
      console.log("[Upload] No chatId in request");
      res.status(400).json({ message: "Chat ID is required" });
      return;
    }

    // Verify user is a participant in the chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId,
    });

    if (!chat) {
      console.log("[Upload] Chat not found:", chatId);
      res.status(404).json({ message: "Chat not found" });
      return;
    }

    // Get user info
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Determine file type
    const fileType = req.file.mimetype.startsWith("image/") ? "image" : "file";
    console.log("[Upload] Uploading file:", req.file.originalname, "type:", fileType);

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "Chatdav-app",
          resource_type: "auto",
        },
        (error, result) => {
          if (error) {
            console.log("[Upload] Cloudinary error:", error);
            reject(error);
          }
          else resolve(result);
        }
      );
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    console.log("[Upload] Upload successful:", (uploadResult as any).secure_url);

    // Create message with file
    const message = await Message.create({
      chat: chatId,
      sender: userId,
      text: req.file.originalname,
      file: {
        url: (uploadResult as any).secure_url,
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        type: fileType,
      },
    });

    // Update chat's last message
    chat.lastMessage = message._id;
    chat.lastMessageAt = new Date();
    await chat.save();

    // Populate sender info
    await message.populate("sender", "name email avatar");

    res.status(201).json({ message });
  } catch (error) {
    res.status(500);
    next(error);
  }
}
