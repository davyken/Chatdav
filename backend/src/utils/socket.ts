import { Socket, Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { verifyToken } from "@clerk/express";
import { Message } from "../models/Message";
import { Chat } from "../models/Chat";
import { User } from "../models/User";

// store online users in memory: userId -> socketId
export const onlineUsers: Map<string, string> = new Map();

// store active calls: callId -> { callerId, recipientId, type, chatId, status }
interface Call {
  id: string;
  callerId: string;
  recipientId: string;
  type: "audio" | "video";
  chatId: string;
  status: "pending" | "accepted" | "rejected" | "ended";
}
const activeCalls: Map<string, Call> = new Map();

export const initializeSocket = (httpServer: HttpServer) => {
  // Allow all origins in development for mobile app testing
  const isDevelopment = process.env.NODE_ENV !== "production";

  const allowedOrigins = isDevelopment
    ? ["http://localhost:8081", "http://localhost:5173", "exp://*", "http://*", "https://*"] // allow all in dev
    : [
        "http://localhost:8081", // Expo mobile
        "http://localhost:5173", // Vite web dev
        process.env.FRONTEND_URL, // production
      ].filter(Boolean) as string[];

  const io = new SocketServer(httpServer, { 
    cors: { 
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // verify socket connection - if the user is authenticated, we will store the user id in the socket

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token; // this is what user will send from client
    if (!token) return next(new Error("Authentication error"));

    try {
      const session = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY! });

      const clerkId = session.sub;

      const user = await User.findOne({ clerkId });
      if (!user) return next(new Error("User not found"));

      socket.data.userId = user._id.toString();

      next();
    } catch (error: any) {
      next(new Error(error));
    }
  });

  // this "connection" event name is special and should be written like this
  // it's the event that is triggered when a new client connects to the server
  io.on("connection", (socket) => {
    const userId = socket.data.userId;

    // send list of currently online users to the newly connected client
    socket.emit("online-users", { userIds: Array.from(onlineUsers.keys()) });

    // store user in the onlineUsers map
    onlineUsers.set(userId, socket.id);

    // notify others that this current user is online
    socket.broadcast.emit("user-online", { userId });

    socket.join(`user:${userId}`);

    socket.on("join-chat", (chatId: string) => {
      socket.join(`chat:${chatId}`);
    });

    socket.on("leave-chat", (chatId: string) => {
      socket.leave(`chat:${chatId}`);
    });

    // handle sending messages
    socket.on("send-message", async (data: { chatId: string; text: string }) => {
      try {
        const { chatId, text } = data;

        const chat = await Chat.findOne({
          _id: chatId,
          participants: userId,
        });

        if (!chat) {
          socket.emit("socket-error", { message: "Chat not found" });
          return;
        }

        const message = await Message.create({
          chat: chatId,
          sender: userId,
          text,
        });

        chat.lastMessage = message._id;
        chat.lastMessageAt = new Date();
        await chat.save();

        await message.populate("sender", "name avatar");

        // emit to chat room (for users inside the chat)
        io.to(`chat:${chatId}`).emit("new-message", message);

        // also emit to participants' personal rooms (for chat list view)
        for (const participantId of chat.participants) {
          io.to(`user:${participantId}`).emit("new-message", message);
        }
      } catch (error) {
        socket.emit("socket-error", { message: "Failed to send message" });
      }
    });

    socket.on("typing", async (data: { chatId: string; isTyping: boolean }) => {
      const typingPayload = {
        userId,
        chatId: data.chatId,
        isTyping: data.isTyping,
      };

      // emit to chat room (for users inside the chat)
      socket.to(`chat:${data.chatId}`).emit("typing", typingPayload);

      // also emit to other participant's personal room (for chat list view)
      try {
        const chat = await Chat.findById(data.chatId);
        if (chat) {
          const otherParticipantId = chat.participants.find((p: any) => p.toString() !== userId);
          if (otherParticipantId) {
            socket.to(`user:${otherParticipantId}`).emit("typing", typingPayload);
          }
        }
      } catch (error) {
        // silently fail - typing indicator is not critical
      }
    });

    // Handle call initiation
    socket.on("call:initiate", async (data: { to: string; type: "audio" | "video"; chatId: string; offer?: any }) => {
      try {
        const { to, type, chatId, offer } = data;
        const recipientSocketId = onlineUsers.get(to);
        const caller = await User.findById(userId);
        
        if (!caller) {
          socket.emit("socket-error", { message: "Caller not found" });
          return;
        }

        const callId = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const call: Call = {
          id: callId,
          callerId: userId,
          recipientId: to,
          type,
          chatId,
          status: "pending",
        };
        activeCalls.set(callId, call);

        // Notify recipient
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("call:incoming", {
            callId,
            caller: {
              _id: caller._id.toString(),
              name: caller.name,
              avatar: caller.avatar,
            },
            type,
            chatId,
            offer,
          });
        } else {
          // User is offline - emit error back
          socket.emit("call:failed", { message: "User is offline" });
          activeCalls.delete(callId);
        }
      } catch (error) {
        socket.emit("socket-error", { message: "Failed to initiate call" });
      }
    });

    // Handle call acceptance
    socket.on("call:accept", (data: { callId: string; answer?: any }) => {
      try {
        const { callId, answer } = data;
        const call = activeCalls.get(callId);
        
        if (!call) {
          socket.emit("socket-error", { message: "Call not found" });
          return;
        }

        call.status = "accepted";
        activeCalls.set(callId, call);

        // Notify caller (who should be the recipient in this case)
        const callerSocketId = onlineUsers.get(call.callerId);
        if (callerSocketId) {
          io.to(callerSocketId).emit("call:accepted", { callId, answer });
        }

        // Also notify the original caller if they're different
        // (for the case where recipient accepts the call)
        const recipientSocketId = onlineUsers.get(call.recipientId);
        if (recipientSocketId && recipientSocketId !== socket.id) {
          io.to(recipientSocketId).emit("call:accepted", { callId, answer });
        }
      } catch (error) {
        socket.emit("socket-error", { message: "Failed to accept call" });
      }
    });

    // Handle ICE candidates
    socket.on("webrtc:ice-candidate", (data: { candidate: any; callId: string }) => {
      try {
        const { candidate, callId } = data;
        const call = activeCalls.get(callId);
        
        if (!call) return;

        // Forward to the other peer
        const otherUserId = call.callerId === userId ? call.recipientId : call.callerId;
        const otherSocketId = onlineUsers.get(otherUserId);
        
        if (otherSocketId) {
          io.to(otherSocketId).emit("webrtc:ice-candidate", { candidate });
        }
      } catch (error) {
        console.error("Error forwarding ICE candidate:", error);
      }
    });

    // Handle call rejection
    socket.on("call:reject", (data: { callId: string }) => {
      try {
        const { callId } = data;
        const call = activeCalls.get(callId);
        
        if (!call) return;

        call.status = "rejected";
        activeCalls.delete(callId);

        const callerSocketId = onlineUsers.get(call.callerId);
        if (callerSocketId) {
          io.to(callerSocketId).emit("call:rejected", { callId });
        }
      } catch (error) {
        socket.emit("socket-error", { message: "Failed to reject call" });
      }
    });

    // Handle call end
    socket.on("call:end", (data: { callId: string }) => {
      try {
        const { callId } = data;
        const call = activeCalls.get(callId);
        
        if (!call) return;

        const otherUserId = call.callerId === userId ? call.recipientId : call.callerId;
        const otherSocketId = onlineUsers.get(otherUserId);

        call.status = "ended";
        activeCalls.delete(callId);

        if (otherSocketId) {
          io.to(otherSocketId).emit("call:ended", { callId });
        }
      } catch (error) {
        socket.emit("socket-error", { message: "Failed to end call" });
      }
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(userId);

      // notify others
      socket.broadcast.emit("user-offline", { userId });
    });
  });

  return io;
};
