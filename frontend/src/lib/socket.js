import { create } from "zustand";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "";

// WebRTC configuration
const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ]
};

console.log("Socket URL configured:", SOCKET_URL);

export const useSocketStore = create((set, get) => ({
  socket: null,
  onlineUsers: new Set(),
  typingUsers: new Map(), // chatId -> userId
  queryClient: null,
  call: null, // { caller, recipient, type, isIncoming, isAccepted, chatId }
  localStream: null,
  remoteStream: null,
  peerConnection: null,

  // Initialize local media stream
  initLocalStream: async (video = true, audio = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio });
      set({ localStream: stream });
      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      return null;
    }
  },

  // Create peer connection and handle WebRTC
  createPeerConnection: (isInitiator) => {
    const { localStream, socket } = get();
    if (!socket) return null;

    const pc = new RTCPeerConnection(rtcConfig);

    // Add local tracks to the connection
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle incoming remote stream
    pc.ontrack = (event) => {
      console.log("Received remote stream:", event.streams[0]);
      set({ remoteStream: event.streams[0] });
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("webrtc:ice-candidate", {
          candidate: event.candidate,
          callId: get().call?.id
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState);
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        get().endCall();
      }
    };

    set({ peerConnection: pc });
    return pc;
  },

  // Start call as initiator
  startCall: async (to, type, chatId) => {
    const { socket, initLocalStream, createPeerConnection } = get();
    console.log("startCall called:", { to, type, chatId, socketConnected: socket?.connected });
    
    if (!socket?.connected) {
      console.warn("Cannot start call: socket not connected");
      alert("Cannot start call: socket not connected. Make sure you're logged in.");
      return;
    }

    // Get local media stream
    console.log("Getting local media stream...");
    const stream = await initLocalStream(type === "video", true);
    if (!stream) {
      console.error("Failed to get local media stream");
      alert("Failed to access camera/microphone. Please check permissions.");
      return;
    }
    console.log("Got local stream:", stream.id);

    // Create peer connection
    const pc = createPeerConnection(true);
    if (!pc) {
      console.error("Failed to create peer connection");
      return;
    }
    console.log("Created peer connection");

    // Create offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log("Created offer");

    set({
      call: {
        type,
        isIncoming: false,
        isAccepted: false,
        chatId,
        recipient: to,
        startedAt: new Date().toISOString(),
      }
    });

    console.log("Emitting call:initiate event");
    socket.emit("call:initiate", { to, type, chatId, offer: pc.localDescription });
  },

  // Handle incoming call offer
  handleIncomingCall: (callData) => {
    const { type, chatId, caller } = callData;
    set({
      call: {
        ...callData,
        isIncoming: true,
        isAccepted: false,
      }
    });
  },

  // Accept call
  acceptCall: async () => {
    const { socket, call, initLocalStream, createPeerConnection } = get();
    if (!socket?.connected || !call) return;

    // Get local media stream
    const stream = await initLocalStream(call.type === "video", true);
    if (!stream) {
      console.error("Failed to get local media stream");
      return;
    }

    // Create peer connection
    const pc = createPeerConnection(false);
    if (!pc) return;

    // Create answer
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit("call:accept", { 
      callId: call.id, 
      answer: pc.localDescription 
    });

    set({ call: { ...call, isAccepted: true } });
  },

  // Handle call accepted with remote description
  handleCallAccepted: async (data) => {
    const { peerConnection, call } = get();
    if (!peerConnection || !call) return;

    if (data.answer) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    }

    set({ call: { ...call, isAccepted: true } });
  },

  // Handle ICE candidate from remote
  handleRemoteIceCandidate: async (candidate) => {
    const { peerConnection } = get();
    if (!peerConnection) return;

    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error("Error adding ICE candidate:", error);
    }
  },

  // Handle offer from remote
  handleRemoteOffer: async (offer) => {
    const { peerConnection, socket, call } = get();
    if (!peerConnection || !socket) return;

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit("call:accept", { 
      callId: call?.id, 
      answer: peerConnection.localDescription 
    });
  },

  // Reject call
  rejectCall: () => {
    const { socket, call } = get();
    if (!socket?.connected || !call) return;
    
    socket.emit("call:reject", { callId: call.id });
    get().cleanupCall();
  },

  // End call
  endCall: () => {
    const { socket, call } = get();
    if (socket?.connected && call) {
      socket.emit("call:end", { callId: call.id });
    }
    get().cleanupCall();
  },

  // Cleanup call resources
  cleanupCall: () => {
    const { localStream, remoteStream, peerConnection } = get();

    // Stop local stream tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
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

  // Legacy function - use startCall instead
  initiateCall: (to, type, chatId) => {
    get().startCall(to, type, chatId);
  },

  connect: (token, queryClient) => {
    const existingSocket = get().socket;
    if (existingSocket?.connected || !queryClient) return;

    // disconnect existing socket if any
    if (existingSocket) existingSocket.disconnect();

    const socket = io(SOCKET_URL, { auth: { token } });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
    });

    socket.on("socket-error", (error) => {
      console.error("Socket error:", error);
    });

    socket.on("online-users", ({ userIds }) => {
      set({ onlineUsers: new Set(userIds) });
    });

    socket.on("user-online", ({ userId }) => {
      set((state) => ({
        onlineUsers: new Set([...state.onlineUsers, userId]),
      }));
    });

    socket.on("user-offline", ({ userId }) => {
      set((state) => {
        const onlineUsers = new Set(state.onlineUsers);
        onlineUsers.delete(userId);
        return { onlineUsers };
      });
    });

    socket.on("typing", ({ userId, chatId, isTyping }) => {
      set((state) => {
        const typingUsers = new Map(state.typingUsers);
        if (isTyping) typingUsers.set(chatId, userId);
        else typingUsers.delete(chatId);
        return { typingUsers };
      });
    });

    socket.on("new-message", (message) => {
      const senderId = message.sender?._id;

      // update messages in current chat, replacing optimistic messages
      queryClient.setQueryData(["messages", message.chat], (old) => {
        if (!old) return [message];
        // remove any optimistic messages (temp IDs) and add the real one
        const filtered = old.filter((m) => !m._id.startsWith("temp-"));
        const exists = filtered.some((m) => m._id === message._id);
        return exists ? filtered : [...filtered, message];
      });

      // update chat's lastMessage directly for instant UI update
      queryClient.setQueryData(["chats"], (oldChats) => {
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

      // clear typing indicator when message received
      set((state) => {
        const typingUsers = new Map(state.typingUsers);
        typingUsers.delete(message.chat);
        return { typingUsers };
      });
    });

    // Call event handlers
    socket.on("call:incoming", ({ callId, caller, type, chatId, offer }) => {
      set({
        call: {
          id: callId,
          caller,
          type,
          isIncoming: true,
          isAccepted: false,
          chatId,
        }
      });
      
      // If there's an offer, handle it
      if (offer) {
        get().handleRemoteOffer(offer);
      }
    });

    socket.on("call:accepted", (data) => {
      get().handleCallAccepted(data);
    });

    socket.on("call:rejected", () => {
      get().cleanupCall();
    });

    socket.on("call:ended", () => {
      get().cleanupCall();
    });

    socket.on("call:missed", () => {
      get().cleanupCall();
    });

    // WebRTC event handlers
    socket.on("webrtc:ice-candidate", (data) => {
      get().handleRemoteIceCandidate(data.candidate);
    });

    socket.on("webrtc:offer", (data) => {
      get().handleRemoteOffer(data.offer);
    });

    socket.on("webrtc:answer", (data) => {
      get().handleCallAccepted(data);
    });

    set({ socket, queryClient });
  },

  disconnect: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({
        socket: null,
        onlineUsers: new Set(),
        typingUsers: new Map(),
        queryClient: null,
      });
    }
  },

  joinChat: (chatId) => {
    get().socket?.emit("join-chat", chatId);
  },

  leaveChat: (chatId) => {
    get().socket?.emit("leave-chat", chatId);
  },

  sendMessage: (chatId, text, currentUser) => {
    const { socket, queryClient } = get();
    if (!socket?.connected || !queryClient) return;

    // create optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      chat: chatId,
      sender: {
        _id: currentUser._id,
        name: currentUser.fullName || currentUser.firstName || "You",
        email: currentUser.primaryEmailAddress?.emailAddress || "",
        avatar: currentUser.imageUrl,
      },
      text,
      createdAt: new Date().toISOString(),
    };

    // add optimistic message immediately
    queryClient.setQueryData(["messages", chatId], (old) => {
      if (!old) return [optimisticMessage];
      return [...old, optimisticMessage];
    });

    // emit to server
    socket.emit("send-message", { chatId, text });

    // handle errors - remove optimistic message if send fails
    socket.once("socket-error", () => {
      queryClient.setQueryData(["messages", chatId], (old) => {
        if (!old) return [];
        return old.filter((m) => m._id !== tempId);
      });
    });
  },

  setTyping: (chatId, isTyping) => {
    get().socket?.emit("typing", { chatId, isTyping });
  },
}));
