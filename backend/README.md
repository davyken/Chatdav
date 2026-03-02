# ChatDav Backend API

## Problem Statement

### Who has the problem?
Developers building real-time chat applications often face challenges with:
- Expensive third-party services (Firebase, Pusher, Ably) for real-time functionality
- Complex pricing structures that scale unpredictably
- Limited control over real-time infrastructure
- Difficulty in customizing real-time behavior

### Why it matters?
Real-time features are essential for modern applications, but the cost and complexity of implementing them can be prohibitive for individual developers and small teams. Understanding how to build real-time systems from scratch is a valuable skill that demonstrates deep technical knowledge.

### Why this solution exists?
This backend was built to demonstrate a complete, production-ready implementation of real-time chat functionality using:
- Custom WebSocket server (no third-party dependencies)
- Scalable architecture with Express and MongoDB
- TypeScript for type safety
- Bun as the runtime for performance

---

## Technical Architecture

### Stack
- **Runtime:** Bun
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** Clerk
- **Real-Time:** Custom WebSocket implementation
- **Language:** TypeScript

### Project Structure

```
src/
├── controllers/       # Request handlers
│   ├── authController.ts    # Authentication logic
│   ├── chatController.ts    # Chat CRUD operations
│   ├── messageController.ts # Message handling
│   └── userController.ts   # User management
├── middleware/       # Express middleware
│   ├── auth.ts              # Clerk authentication
│   └── errorHandler.ts      # Global error handling
├── models/           # MongoDB schemas
│   ├── User.ts              # User model
│   ├── Chat.ts              # Chat/conversation model
│   └── Message.ts           # Message model
├── routes/          # API route definitions
│   ├── authRoutes.ts
│   ├── chatRoutes.ts
│   ├── messageRoutes.ts
│   └── userRoutes.ts
├── utils/           # Utilities
│   └── socket.ts    # WebSocket server setup
├── config/         # Configuration
│   └── database.ts # MongoDB connection
├── scripts/        # Utility scripts
│   └── seed.ts     # Database seeding
└── app.ts          # Express application setup
```

### Database Design

The database uses three interconnected collections:

1. **Users** - Store user profiles synced from Clerk
2. **Chats** - Store conversations between users
3. **Messages** - Store individual messages with optional file attachments

Relationships:
- Users can have many Chats (many-to-many via members array)
- Chats can have many Messages (one-to-many)
- Messages reference both Chat and Sender (User)

### API Communication

REST API for CRUD operations + WebSocket for real-time events.

---

## Features

### Authentication
- Clerk OAuth integration
- JWT token validation via Clerk middleware
- Automatic user creation/sync on first login
- Protected routes requiring authentication

### Chat Management
- Create new conversations between users
- List all conversations for a user
- Get single conversation by ID
- Real-time updates when chats are created

### Message Handling
- Send text messages
- Send file attachments (images, documents)
- Retrieve message history with pagination
- Real-time message delivery via WebSocket
- Message timestamps and sorting

### Real-Time Features
- Typing indicators (start/stop events)
- Online/offline presence tracking
- Instant message delivery
- Join/leave chat room events

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/callback` | Clerk OAuth callback |
| GET | `/api/chats` | Get user's chats |
| POST | `/api/chats` | Create new chat |
| GET | `/api/chats/:id` | Get chat by ID |
| GET | `/api/messages/:chatId` | Get messages for chat |
| POST | `/api/messages` | Send new message |
| GET | `/api/users` | Search users |
| GET | `/api/users/:id` | Get user by ID |

### WebSocket Events

**Client sends:**
- `join-chat` - Join a chat room
- `leave-chat` - Leave a chat room  
- `send-message` - Send a message
- `typing-start` - Start typing indicator
- `typing-stop` - Stop typing indicator

**Server emits:**
- `receive-message` - New message broadcast
- `user-typing` - Typing indicator broadcast
- `user-online` - User presence update
- `user-offline` - User presence update

---

## Challenges Faced

### Challenge 1: WebSocket Room Management

**Problem:** Managing multiple chat rooms with users joining and leaving dynamically, while handling server restarts and connection drops.

**Solution:** Implemented a room-based architecture using Socket.io's room feature. Maintained a Map of chat IDs to connected users for efficient message routing.

```typescript
// Socket connection handling
io.on('connection', (socket) => {
  socket.on('join-chat', (chatId) => {
    socket.join(chatId);
    const roomUsers = chatUsers.get(chatId) || new Set();
    roomUsers.add(socket.userId);
    chatUsers.set(chatId, roomUsers);
  });

  socket.on('leave-chat', (chatId) => {
    socket.leave(chatId);
    const roomUsers = chatUsers.get(chatId);
    roomUsers?.delete(socket.userId);
  });
});
```

**What I Learned:** Socket.io's room abstraction makes multi-user chat implementation straightforward, but you need to carefully manage state for presence tracking.

### Challenge 2: Database Indexing for Performance

**Problem:** Message queries were slow as the chat history grew, especially when loading older messages.

**Solution:** Added compound indexes on the Messages collection:

```typescript
MessageSchema.index({ chat: 1, createdAt: 1 });
```

This optimized both chronological queries and chat-specific lookups.

**What I Learned:** Proactive database indexing is crucial for performance. Monitor query patterns and add indexes before they become problems.

### Challenge 3: CORS Configuration for Multiple Clients

**Problem:** Running three clients (web, mobile dev, mobile production) required flexible CORS configuration.

**Solution:** Implemented environment-based CORS:

```typescript
const isDevelopment = process.env.NODE_ENV !== "production";
const allowedOrigins = isDevelopment
  ? ["http://localhost:8081", "http://localhost:5173", "exp://*"]
  : [process.env.FRONTEND_URL];
```

**What I Learned:** Environment-specific configuration is essential for development workflows while maintaining security in production.

---

## What I Learned

### Technical Lessons

1. **WebSocket Protocol:** Deep understanding of the WebSocket protocol, connection lifecycle, and event-driven architecture.

2. **Socket.io Patterns:** Mastered room-based broadcasting, namespaces, and connection management.

3. **MongoDB Aggregation:** Learned complex aggregation pipelines for fetching chat previews with last messages.

### Workflow Lessons

1. **TypeScript Best Practices:** Using strict TypeScript configuration caught many bugs at compile time.

2. **Error Handling:** Centralized error handling with custom error classes made debugging easier.

3. **Environment Management:** Using environment variables properly for configuration management.

### Code Organization Lessons

1. **Controller Pattern:** Separating business logic into controllers keeps routes clean and testable.

2. **Middleware Stack:** Using middleware for cross-cutting concerns (auth, error handling) improved code reusability.

3. **Model Relationships:** Properly defining Mongoose schemas with correct types and indexes.

---

## Future Improvements

### Short Term
- [ ] Add message read receipts
- [ ] Implement message reactions
- [ ] Add pagination cursors for better performance
- [ ] Implement message editing and deletion

### Long Term
- [ ] Add voice/video calling signaling via WebRTC
- [ ] Implement group chats with admin roles
- [ ] Add end-to-end encryption
- [ ] Implement message search with Elasticsearch
- [ ] Add rate limiting and abuse prevention

---

## Installation

### Prerequisites
- Bun runtime
- MongoDB (local or Atlas cluster)

### Setup

```bash
# Install dependencies
bun install

# Create environment file
cat > .env << EOF
MONGODB_URI=your_mongodb_uri
PORT=3000
NODE_ENV=development
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
FRONTEND_URL=http://localhost:5173
EOF

# Run development server
bun run dev
```

### Available Scripts

```bash
bun run dev      # Start development server
bun run build   # Build for production
bun start       # Start production server
bun run seed    # Seed database with test data
```

---

## API Documentation

### Authentication Flow

1. User authenticates via Clerk on frontend
2. Frontend sends Clerk token to `/api/auth/callback`
3. Backend validates token, creates/updates user in MongoDB
4. Subsequent requests include Clerk token in header
5. Middleware validates token for protected routes

### Real-Time Flow

1. Frontend connects to WebSocket server
2. User joins chat room with `join-chat` event
3. When user sends message:
   - Client emits `send-message` with content
   - Server saves to MongoDB
   - Server broadcasts `receive-message` to room
4. Typing indicators follow same pattern

---

## Tech Stack

![Bun](https://img.shields.io/badge/Bun-FE6F00?style=flat&logo=bun&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat&logo=socket.io&logoColor=white)
![Clerk](https://img.shields.io/badge/Clerk-6C47FF?style=flat&logo=&logoColor=white)

---

## License

MIT License

---

## Related Projects

- [ChatDav Web](./web) - React web application
- [ChatDav Mobile](./mobile) - React Native mobile app
