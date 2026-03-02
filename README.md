# Hi, I'm a Full-Stack Developer! 👋

## Professional Headline

**Full-Stack Developer | React & React Native Specialist | Building Real-Time Applications**

## Open To Work

I'm actively seeking opportunities in startups and remote positions where I can contribute to meaningful projects and continue growing as a developer. Open to Frontend, Backend, or Full-Stack roles.

---

## Tech Stack

### Frontend
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-000020?style=flat&logo=expo&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

### Backend
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-FE6F00?style=flat&logo=bun&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)

### Tools & Services
![Git](https://img.shields.io/badge/Git-F05032?style=flat&logo=git&logoColor=white)
![Clerk](https://img.shields.io/badge/Clerk-6C47FF?style=flat&logo=&logoColor=white)
![Sentry](https://img.shields.io/badge/Sentry-362D59?style=flat&logo=sentry&logoColor=white)
![Postman](https://img.shields.io/badge/Postman-FF6C37?style=flat&logo=postman&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)

---

## Featured Projects

### 1. ChatDav - Real-Time Cross-Platform Chat Application
**Role:** Full-Stack Developer | **Tech:** React Native, React, Express, MongoDB, WebSocket

A production-ready realtime chat application with mobile (iOS/Android) and web clients sharing a single backend API. Features real-time messaging, typing indicators, online presence, and file sharing.

[View Project](./mobile) | [Backend](./backend) | [Web](./web)

---

### 2. Backend API Server
**Role:** Backend Developer | **Tech:** Bun, Express, MongoDB, TypeScript, Clerk

RESTful API with custom WebSocket implementation for real-time communication. Includes authentication, chat management, message handling, and user profiles.

[View Project](./backend)

---

### 3. Mobile Application (React Native + Expo)
**Role:** Frontend Developer | **Tech:** React Native, Expo, TypeScript, Tailwind

Cross-platform mobile chat application with native performance. Features secure authentication, real-time updates, media sharing, and responsive design.

[View Project](./mobile)

---

## Featured Project READMEs

Each project has its own detailed README with:

- **Problem Statement** - Who has the problem and why it matters
- **Technical Architecture** - Frontend, backend, and database structure
- **Features** - Authentication, validation, error handling, security
- **Challenges Faced** - Specific frontend, backend, and debugging challenges
- **What I Learned** - Technical, workflow, and code organization lessons
- **Future Improvements** - Planned enhancements and optimizations

---

## GitHub Statistics

![GitHub Stats](https://github-readme-stats.vercel.app/api?username=YOUR_USERNAME&show_icons=true&theme=transparent)
![Top Languages](https://github-readme-stats.vercel.app/api/top-langs/?username=YOUR_USERNAME&layout=compact&theme=transparent)

---

## Connect With Me

- **Email:** your.email@example.com
- **LinkedIn:** [Your LinkedIn Profile](https://linkedin.com/in/yourprofile)
- **Twitter:** [@yourhandle](https://twitter.com/yourhandle)
- **Portfolio:** [yourportfolio.com](https://yourportfolio.com)

---

## Professional Journey

I'm a passionate full-stack developer with a focus on building real-time applications. My journey started with curiosity about how modern web applications work, and I've since developed expertise in both frontend and backend technologies.

### What I Bring

- **Problem-Solving Skills:** Ability to break down complex requirements into manageable technical solutions
- **Full-Stack Development:** Experience building complete applications from database design to user interface
- **Real-Time Systems:** Understanding of WebSocket communication and event-driven architecture
- **Cross-Platform Development:** Skills in creating applications that work seamlessly across web and mobile
- **Code Quality:** Commitment to clean, maintainable, and well-documented code

---

## Currently Learning

- Advanced TypeScript patterns
- GraphQL APIs
- Cloud infrastructure (AWS/GCP)
- CI/CD pipelines

---

## Open Source Contributions

I believe in giving back to the developer community. Check out my repositories to see my work and feel free to contribute!

---

*Last updated: March 2026*

---

# Project Documentation

Below is the detailed documentation for each of my featured projects.

---

# ChatDav - Real-Time Cross-Platform Chat Application

## Problem Statement

### Who has the problem?
In today's digital age, people need fast, reliable communication tools that work seamlessly across multiple devices. Whether it's teams collaborating on projects, friends staying in touch, or communities building connections, users expect instant messaging with real-time updates.

### Why it matters?
Traditional messaging apps often require users to manually refresh to see new messages, lack cross-platform consistency, or rely on expensive third-party services for real-time functionality. This creates friction in user experience and increases development costs for developers building chat features.

### Why this solution exists?
ChatDav was built to demonstrate how to create a production-ready, real-time chat application from scratch without relying on expensive services like Firebase or Pusher. It provides a complete reference implementation showing how to implement WebSocket communication, handle real-time events, and build consistent experiences across web and mobile platforms.

---

## Technical Architecture

### Frontend Structure

#### Mobile App (React Native + Expo)
```
mobile/
├── app/                    # File-based routing (Expo Router)
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main tab navigation
│   ├── chat/              # Chat detail screen
│   └── new-chat/          # New conversation screen
├── components/            # Reusable UI components
│   ├── ChatItem.tsx       # Chat list item
│   ├── MessageBubble.tsx  # Message display
│   ├── EmojiPicker.tsx    # Emoji selection
│   └── ...
├── hooks/                  # Custom React hooks
│   ├── useAuth.ts         # Authentication logic
│   ├── useChats.ts        # Chat management
│   ├── useMessages.ts     # Message handling
│   └── useSocketConnection.ts  # WebSocket connection
├── lib/                    # Core libraries
│   ├── axios.ts           # HTTP client
│   └── socket.ts          # WebSocket client
└── types/                  # TypeScript definitions
```

#### Web App (React + Vite)
```
web/
├── src/
│   ├── components/        # React components
│   │   ├── ChatHeader.jsx
│   │   ├── ChatInput.jsx
│   │   ├── MessageBubble.jsx
│   │   └── ...
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page components
│   │   ├── ChatPage.jsx
│   │   └── HomePage.jsx
│   └── lib/              # Utilities
│       ├── axios.js
│       ├── socket.js
│       └── utils.js
└── index.html
```

### Backend Structure
```
backend/
├── src/
│   ├── controllers/       # Request handlers
│   │   ├── authController.ts
│   │   ├── chatController.ts
│   │   ├── messageController.ts
│   │   └── userController.ts
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts       # Authentication
│   │   └── errorHandler.ts
│   ├── models/           # MongoDB schemas
│   │   ├── User.ts
│   │   ├── Chat.ts
│   │   └── Message.ts
│   ├── routes/          # API routes
│   │   ├── authRoutes.ts
│   │   ├── chatRoutes.ts
│   │   ├── messageRoutes.ts
│   │   └── userRoutes.ts
│   ├── utils/           # Utilities
│   │   └── socket.ts    # WebSocket server
│   ├── config/         # Configuration
│   │   └── database.ts
│   ├── scripts/        # Utility scripts
│   │   └── seed.ts
│   └── app.ts          # Express app
└── index.ts            # Entry point
```

### Database Structure

#### MongoDB Collections

**Users Collection**
```typescript
{
  _id: ObjectId,
  clerkId: string,        // Clerk authentication ID
  name: string,
  email: string,
  avatar: string,
  createdAt: Date,
  updatedAt: Date
}
```

**Chats Collection**
```typescript
{
  _id: ObjectId,
  members: ObjectId[],     // User references
  createdAt: Date,
  updatedAt: Date
}
```

**Messages Collection**
```typescript
{
  _id: ObjectId,
  chat: ObjectId,         // Chat reference
  sender: ObjectId,       // User reference
  text: string,
  file?: {
    url: string,
    filename: string,
    mimetype: string,
    size: number,
    type: "image" | "file"
  },
  createdAt: Date,
  updatedAt: Date
}
```

### API Communication

#### REST Endpoints

**Authentication**
- `GET /api/auth/me` - Get current user
- `POST /api/auth/callback` - Clerk OAuth callback

**Chats**
- `GET /api/chats` - Get user's chats
- `POST /api/chats` - Create new chat
- `GET /api/chats/:id` - Get chat by ID

**Messages**
- `GET /api/messages/:chatId` - Get messages for chat
- `POST /api/messages` - Send new message

**Users**
- `GET /api/users` - Search users
- `GET /api/users/:id` - Get user by ID

#### WebSocket Events

**Client → Server**
- `join-chat` - Join a chat room
- `leave-chat` - Leave a chat room
- `send-message` - Send a message
- `typing-start` - User started typing
- `typing-stop` - User stopped typing

**Server → Client**
- `receive-message` - New message received
- `user-typing` - Someone is typing
- `user-online` - User came online
- `user-offline` - User went offline

---

## Features

### Authentication
- Secure authentication using Clerk (OAuth provider)
- JWT-based session management
- Protected routes on both mobile and web
- Automatic user sync between Clerk and MongoDB

### Real-Time Messaging
- Custom WebSocket implementation (no third-party services)
- Instant message delivery
- Typing indicators
- Online/offline presence
- Message persistence in MongoDB

### Chat Management
- Create new conversations
- View chat history
- Real-time chat list updates
- Unread message indicators

### File Sharing
- Image uploads
- Document uploads
- File type validation
- Size limits

### Responsive Design
- Mobile-first approach
- Consistent UI across platforms
- Adaptive layouts for different screen sizes

### Error Handling
- Global error boundaries
- User-friendly error messages
- Automatic retry logic
- Sentry integration for error monitoring

### Security Considerations
- Clerk authentication middleware
- CORS configuration
- Input validation
- Sanitized database queries
- Protected WebSocket connections

---

## Challenges Faced

### Frontend Challenge: Managing Protected Routes

**Problem:** Implementing authentication-protected routes in both React (web) and React Native (mobile) required different approaches due to platform differences.

**Solution:** Created a custom `PrivateRoute` component for the web app that checks authentication state before rendering protected content. For React Native, implemented an `AuthSync` component that handles navigation based on authentication state.

**Lesson Learned:** Platform-specific solutions are sometimes necessary, but keeping the core authentication logic shared through custom hooks (`useAuth`) ensures consistency across platforms.

### Backend Challenge: WebSocket Room Management

**Problem:** Managing WebSocket connections for multiple chat rooms while handling user disconnections and reconnections gracefully.

**Solution:** Implemented a room-based architecture where users join specific chat rooms using their chat ID. The socket server maintains a Map of room ID to set of connected sockets, allowing targeted message broadcasting.

**Key Implementation:**
```typescript
// Room join/leave logic
socket.on('join-chat', (chatId: string) => {
  socket.join(chatId);
  // Track user in room
});

// Broadcasting to specific room
io.to(chatId).emit('receive-message', message);
```

### Debugging Experience: Race Conditions in Real-Time Updates

**Problem:** Messages appearing out of order when multiple messages were sent rapidly, and chat list not updating immediately after sending a message.

**Solution:** 
1. Added optimistic updates - immediately show message in UI before server confirmation
2. Implemented message sorting by timestamp on the client
3. Added a refresh mechanism for chat list after message send

**Key Learning:** Real-time applications require careful handling of asynchronous events. Using React Query's caching and invalidation patterns helped maintain data consistency.

---

## What I Learned

### Technical Lessons

1. **WebSocket Architecture:** Building a custom WebSocket server from scratch taught me about event-driven programming, connection management, and real-time data flow.

2. **Cross-Platform Development:** Developing simultaneously for web and mobile helped me understand the differences and similarities between React and React Native, particularly around navigation, styling, and native modules.

3. **Authentication Patterns:** Integrating Clerk taught me about OAuth flows, JWT validation, and secure session management.

### Workflow Lessons

1. **Monorepo Structure:** Managing three interconnected projects (backend, web, mobile) in a single repository required careful dependency management and clear documentation.

2. **Environment Configuration:** Different environments (development, production) require different configurations, and managing these securely is crucial.

3. **API Design:** Building RESTful APIs while simultaneously building consumers taught me the importance of backward compatibility and clear API contracts.

### Code Organization Lessons

1. **Modular Architecture:** Separating concerns into controllers, models, routes, and middleware in the backend made the code more maintainable.

2. **Custom Hooks:** Extracting reusable logic into custom hooks (useAuth, useChats, useMessages) improved code reusability and readability.

3. **Type Safety:** Using TypeScript throughout the full stack improved code quality and caught errors at compile time.

---

## Future Improvements

### Short Term
- [ ] Add end-to-end encryption for messages
- [ ] Implement push notifications for mobile
- [ ] Add message reactions and replies
- [ ] Implement group chat functionality

### Long Term
- [ ] Add voice and video calling using WebRTC
- [ ] Implement message search functionality
- [ ] Add message deletion and editing
- [ ] Create a desktop application using Electron
- [ ] Implement message read receipts
- [ ] Add enterprise features (channels, roles, permissions)

---

## Installation

### Prerequisites
- Node.js 18+
- Bun (for backend)
- MongoDB (local or Atlas)
- Clerk account (for authentication)

### Backend Setup

```bash
cd backend

# Install dependencies
bun install

# Create .env file
cp .env.example .env
# Fill in your environment variables

# Run development server
bun run dev
```

### Web Setup

```bash
cd web

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Fill in your environment variables

# Run development server
npm run dev
```

### Mobile Setup

```bash
cd mobile

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Fill in your environment variables

# Start Expo
npx expo start
```

---

## Live Demo

**Web Application:** [https://chatdav.example.com](https://chatdav.example.com)

**Mobile App:** Available on iOS and Android via Expo Go

---

## Screenshots

![Chat List](./web/public/screenshot-for-readme.png)

---

## License

MIT License - feel free to use this project for learning and inspiration!

---

## Acknowledgments

- [Clerk](https://clerk.com) for authentication
- [Expo](https://expo.dev) for cross-platform development
- [MongoDB](https://mongodb.com) for database
- [Bun](https://bun.sh) for fast JavaScript runtime
