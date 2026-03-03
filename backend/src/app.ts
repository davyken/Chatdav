import express from "express";
import path from "path";
import cors from "cors";

import { clerkMiddleware } from "@clerk/express";

import authRoutes from "./routes/authRoutes";
import chatRoutes from "./routes/chatRoutes";
import messageRoutes from "./routes/messageRoutes";
import userRoutes from "./routes/userRoutes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

// Allow specific origins for production
const allowedOrigins = [
  "http://localhost:8081", // Expo mobile
  "http://localhost:5173", // Vite web dev
  "https://chatdav-2aa5.vercel.app", // Production frontend on Vercel
  "https://chatdav-2aa5.vercel.app/", // With trailing slash
];

// In production, also allow any mobile app origins
const corsOptions: cors.CorsOptions = {
  origin: allowedOrigins,
  credentials: true, // allow credentials from client (cookies, authorization headers, etc.)
};

app.use(cors(corsOptions));

app.use(express.json()); // parses incoming JSON request bodies
app.use(clerkMiddleware());

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

// error handlers must come after all the routes and other middlewares
app.use(errorHandler);

// error handlers must come after all the routes and other middlewares so they can catch errors passed with next(err) or thrown inside async handlers.
app.use(errorHandler);

// error handlers must come after all the routes and other middlewares so they can catch errors passed with next(err) or thrown inside async handlers.
app.use(errorHandler);

// serve frontend in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../../frontend/dist")));

  app.get("/{*any}", (_, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
  });
}

export default app;
