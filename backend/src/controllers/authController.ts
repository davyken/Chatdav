import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { User } from "../models/User";
import { clerkClient, getAuth } from "@clerk/express";

export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500);
    next(error);
  }
}

export async function authCallback(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // requireAuth middleware already validated the token, get clerkId from auth object
    const auth = getAuth(req);
    const clerkId = (auth as { userId?: string }).userId;
    console.log("authCallback - clerkId:", clerkId);

    if (!clerkId) {
      res.status(401).json({ message: "Unauthorized - invalid token" });
      return;
    }

    let user = await User.findOne({ clerkId });
    console.log("authCallback - existing user:", user);

    if (!user) {
      // get user info from clerk and save to db
      const clerkUser = await clerkClient.users.getUser(clerkId);
      console.log("authCallback - clerkUser:", clerkUser);

      user = await User.create({
        clerkId,
        name: clerkUser.firstName
          ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim()
          : clerkUser.emailAddresses[0]?.emailAddress?.split("@")[0],
        email: clerkUser.emailAddresses[0]?.emailAddress,
        avatar: clerkUser.imageUrl,
      });
      console.log("authCallback - created user:", user);
    }

    res.json(user);
  } catch (error) {
    console.error("authCallback error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ message });
  }
}
