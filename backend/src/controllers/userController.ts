import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/auth";
import { User } from "../models/User";

export async function getUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    console.log("getUsers - userId:", userId);

    const users = await User.find({ _id: { $ne: userId } })
      .select("name email avatar")
      .limit(50);

    console.log("getUsers - found users:", users.length);
    res.json(users);
  } catch (error) {
    console.error("getUsers error:", error);
    res.status(500);
    next(error);
  }
}
