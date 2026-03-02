import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { QueryClient } from "@tanstack/react-query";
import { Chat, Message, MessageSender } from "@/types";
import * as Sentry from "@sentry/react-native";
// Use mock WebRTC for Expo Go compatibility
import {
  RTCPeerConnection,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
  RTCIceCandidate,
} from "./webrtc-mock";

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || "http://localhost:3000";

console.log("Socket URL:", SOCKET_URL);

// WebRTC configuration
const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ]
};

interface CallInfo {
  id: string;
  caller: { _id: string; name: string; avatar: string };
  type: "audio" | "video";
  chatId: string;
  isIncoming: boolean;
  isAccepted: boolean;
}

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
  typingUsers: Map<string, string>; // chatId -> userId
  unreadChats: Set<string>;
  currentChatId: string | null;
  queryClient: QueryClient | null;
  call: CallInfo | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;

  connect: (token: string, queryClient: QueryClient) => void;
  disconnect: () => void;
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  sendMessage: (chatId: string, text: string, currentUser: MessageSender) => void;
  sendTyping: (chatId: string, isTyping: boolean) => void;
  startCall: (to: string, type: "audio" | "video", chatId: string) => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  cleanupCall: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  onlineUsers: new Set(),
  typingUsers: new Map(),
  unreadChats: new Set(),
  currentChatId: null,
  queryClient: null,
  call: null,
  localStream: null,
  remoteStream: null,
  peerConnection: null,

  connect: (token, queryClient) => {
    const existingSocket = get().socket;
    if (existingSocket?.connected) return;

    if (existingSocket) existingSocket.disconnect();

    const socket = io(SOCKET_URL, { 
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      transports: ["websocket", "polling"], // Try websocket first, fallback to polling
    });

    socket.on("connect", () => {
      console.log("Socket connected, id:", socket.id);
      Sentry.logger.info("Socket connected", { socketId: socket.id });
      set({ isConnected: true });
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      Sentry.logger.error("Socket connection error", { 
        message: error.message,
        url: SOCKET_URL 
      });
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnect", socket.id);
      Sentry.logger.info("Socket disconnect", { socketId: socket.id });
      set({ isConnected: false });
    });

    socket.on("online-users", ({ userIds }: { userIds: string[] }) => {
      console.log("Received online-users:", userIds);
      set({ onlineUsers: new Set(userIds) });
    });

    socket.on("user-online", ({ userId }: { userId: string }) => {
      set((state) => ({
        onlineUsers: new Set([...state.onlineUsers, userId]),
      }));
    });

    socket.on("user-offline", ({ userId }: { userId: string }) => {
      set((state) => {
        const onlineUsers = new Set(state.onlineUsers);
        onlineUsers.delete(userId);
        return { onlineUsers: onlineUsers };
      });
    });

    socket.on("socket-error", (error: { message: string }) => {
      console.error("Socket error:", error.message);
      Sentry.logger.error("Socket error occurred", {
        message: error.message,
      });
    });

    socket.on("new-message", (message: Message) => {
      const senderId = (message.sender as MessageSender)._id;
      const { currentChatId } = get();

      // add message to the chat's message list, replacing optimistic messages
      queryClient.setQueryData<Message[]>(["messages", message.chat], (old) => {
        if (!old) return [message];
        // remove any optimistic messages (temp IDs) and add the real one
        const filtered = old.filter((m) => !m._id.startsWith("temp-"));
        if (filtered.some((m) => m._id === message._id)) return filtered;
        return [...filtered, message];
      });

      // Update chat's lastMessage directly for instant UI update
      queryClient.setQueryData<Chat[]>(["chats"], (oldChats) => {
        return oldChats?.map((chat) => {
          if (chat._id === message.chat) {
            return {
              ...chat,
              lastMessage: {
                _id: message._id,
                text: message.text,
                sender: senderId,
                createdAt: message.createdAt,
              },
              lastMessageAt: message.createdAt,
            };
          }
          return chat;
        });
      });

      // mark as unread if not currently viewing this chat and message is from other user
      if (currentChatId !== message.chat) {
        const chats = queryClient.getQueryData<Chat[]>(["chats"]);
        const chat = chats?.find((c) => c._id === message.chat);
        if (chat?.participant && senderId === chat.participant._id) {
          set((state) => ({
            unreadChats: new Set([...state.unreadChats, message.chat]),
          }));
        }
      }

      // clear typing indicator when message received
      set((state) => {
        const typingUsers = new Map(state.typingUsers);
        typingUsers.delete(message.chat);
        return { typingUsers: typingUsers };
      });
    });

    socket.on(
      "typing",
      ({ userId, chatId, isTyping }: { userId: string; chatId: string; isTyping: boolean }) => {
        set((state) => {
          const typingUsers = new Map(state.typingUsers);
          if (isTyping) typingUsers.set(chatId, userId);
          else typingUsers.delete(chatId);

          return { typingUsers: typingUsers };
        });
      }
    );

    // Call event handlers
    socket.on("call:incoming", async ({ callId, caller, type, chatId, offer }: { callId: string; caller: { _id: string; name: string; avatar: string }; type: "audio" | "video"; chatId: string; offer?: any }) => {
      set({
        call: {
          id: callId,
          caller,
          type,
          chatId,
          isIncoming: true,
          isAccepted: false,
        }
      });

      // If there's an offer, handle it
      if (offer) {
        const { peerConnection } = get();
        if (peerConnection) {
          await peerConnection.setRemoteDescription(new (RTCSessionDescription as any)(offer));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          socket.emit("call:accept", { callId, answer: peerConnection.localDescription });
        }
      }
    });

    socket.on("call:accepted", async ({ callId, answer }: { callId: string; answer?: any }) => {
      const { peerConnection, call } = get();
      if (peerConnection && answer) {
        await peerConnection.setRemoteDescription(new (RTCSessionDescription as any)(answer));
      }
      set((state) => ({
        call: state.call ? { ...state.call, isAccepted: true } : null
      }));
    });

    socket.on("call:rejected", () => {
      get().cleanupCall();
    });

    socket.on("call:ended", () => {
      get().cleanupCall();
    });

    // WebRTC event handlers
    socket.on("webrtc:ice-candidate", async ({ candidate }: { candidate: any }) => {
      const { peerConnection } = get();
      if (peerConnection) {
        try {
          await peerConnection.addIceCandidate(new (RTCIceCandidate as any)(candidate));
        } catch (error) {
          console.error("Error adding ICE candidate:", error);
        }
      }
    });

    set({ socket, queryClient });
  },

  disconnect: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({
        socket: null,
        isConnected: false,
        onlineUsers: new Set(),
        typingUsers: new Map(),
        unreadChats: new Set(),
        currentChatId: null,
        queryClient: null,
      });
    }
  },
  joinChat: (chatId) => {
    const socket = get().socket;
    set((state) => {
      const unreadChats = new Set(state.unreadChats);
      unreadChats.delete(chatId);
      return { currentChatId: chatId, unreadChats: unreadChats };
    });

    if (socket?.connected) {
      socket.emit("join-chat", chatId);
    }
  },
  leaveChat: (chatId) => {
    const { socket } = get();
    set({ currentChatId: null });
    if (socket?.connected) {
      socket.emit("leave-chat", chatId);
    }
  },
  sendMessage: (chatId, text, currentUser) => {
    const { socket, queryClient } = get();
    if (!socket?.connected || !queryClient) return;

    // optimistic updates
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      _id: tempId,
      chat: chatId,
      sender: currentUser,
      text,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // add optimistic message immediately
    queryClient.setQueryData<Message[]>(["messages", chatId], (old) => {
      if (!old) return [optimisticMessage];
      return [...old, optimisticMessage];
    });

    socket.emit("send-message", { chatId, text });

    Sentry.logger.info("Message sent successfully", { chatId, messageLength: text.length });

    const errorHandler = (error: { message: string }) => {
      Sentry.logger.error("Failed to send message", {
        chatId,
        error: error.message,
      });
      queryClient.setQueryData<Message[]>(["messages", chatId], (old) => {
        if (!old) return [];
        return old.filter((m) => m._id !== tempId);
      });
      socket.off("socket-error", errorHandler);
    };

    socket.once("socket-error", errorHandler);
  },

  sendTyping: (chatId, isTyping) => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit("typing", { chatId, isTyping });
    }
  },

  // Call functions with WebRTC
  startCall: async (to, type, chatId) => {
    const { socket } = get();
    if (!socket?.connected) {
      console.warn("Cannot start call: socket not connected");
      return;
    }

    try {
      // Get local media stream
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: type === "video"
      });
      set({ localStream: stream });

      // Create peer connection
      const pc = new (RTCPeerConnection as any)(rtcConfig);
      
      // Add local tracks
      if (stream) {
        stream.getTracks().forEach((track: any) => {
          pc.addTrack(track, stream);
        });
      }

      // Handle remote stream
      pc.ontrack = (event: any) => {
        set({ remoteStream: event.streams[0] });
      };

      // Handle ICE candidates
      pc.onicecandidate = (event: any) => {
        if (event.candidate) {
          socket.emit("webrtc:ice-candidate", {
            candidate: event.candidate,
            callId: get().call?.id
          });
        }
      };

      set({ peerConnection: pc });

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      set({
        call: {
          id: `call-${Date.now()}`,
          type,
          isIncoming: false,
          isAccepted: false,
          chatId,
          caller: { _id: "", name: "", avatar: "" },
        }
      });

      socket.emit("call:initiate", { to, type, chatId, offer: pc.localDescription });
    } catch (error) {
      console.error("Error starting call:", error);
    }
  },

  acceptCall: async () => {
    const { socket, call } = get();
    if (!socket?.connected || !call) return;

    try {
      // Get local media stream
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: call.type === "video"
      });
      set({ localStream: stream });

      // Create peer connection
      const pc = new (RTCPeerConnection as any)(rtcConfig);
      
      // Add local tracks
      if (stream) {
        stream.getTracks().forEach((track: any) => {
          pc.addTrack(track, stream);
        });
      }

      // Handle remote stream
      pc.ontrack = (event: any) => {
        set({ remoteStream: event.streams[0] });
      };

      // Handle ICE candidates
      pc.onicecandidate = (event: any) => {
        if (event.candidate) {
          socket.emit("webrtc:ice-candidate", {
            candidate: event.candidate,
            callId: call.id
          });
        }
      };

      set({ peerConnection: pc });

      socket.emit("call:accept", { callId: call.id });
      set({ call: { ...call, isAccepted: true } });
    } catch (error) {
      console.error("Error accepting call:", error);
    }
  },

  rejectCall: () => {
    const { socket, call, cleanupCall } = get();
    if (!socket?.connected || !call) return;

    socket.emit("call:reject", { callId: call.id });
    cleanupCall();
  },

  endCall: () => {
    const { socket, call, cleanupCall } = get();
    if (socket?.connected && call) {
      socket.emit("call:end", { callId: call.id });
    }
    cleanupCall();
  },

  cleanupCall: () => {
    const { localStream, remoteStream, peerConnection } = get();

    // Stop local stream tracks
    if (localStream) {
      localStream.getTracks().forEach((track: any) => track.stop());
    }

    // Close peer connection
    if (peerConnection) {
      peerConnection.close();
    }

    set({
      call: null,
      localStream: null,
      remoteStream: null,
      peerConnection: null,
    });
  },
}));
