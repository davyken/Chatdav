# ChatDav Mobile App

## Problem Statement

### Who has the problem?
Mobile users need fast, reliable chat applications that provide:
- Native performance on iOS and Android
- Seamless real-time updates
- Consistent experience across devices
- Offline capability and reliable data sync

### Why it matters?
Users expect chat applications to be:
- Fast and responsive (no waiting for manual refresh)
- Reliable (work even with spotty connections)
- Feature-rich (typing indicators, online status, file sharing)
- Professional (polished UI/UX)

### Why this solution exists?
ChatDav Mobile demonstrates how to build a production-ready React Native chat application that:
- Shares the same backend API as the web version
- Provides native performance on iOS and Android
- Implements real-time features without third-party services
- Follows React Native best practices

---

## Technical Architecture

### Stack
- **Framework:** React Native with Expo
- **Language:** TypeScript
- **Styling:** Tailwind CSS (via NativeWind)
- **Navigation:** Expo Router (file-based routing)
- **State Management:** React Query + Context
- **HTTP Client:** Axios
- **Real-Time:** Socket.io-client
- **Authentication:** Clerk

### Project Structure

```
app/                    # File-based routing (Expo Router)
├── (auth)/            # Authentication screens
│   └── index.tsx      # Login screen
├── (tabs)/            # Main app tabs
│   ├── index.tsx      # Home/Chats list
│   └── profile.tsx    # User profile
├── chat/              # Chat detail screen
│   └── [id].tsx       # Dynamic route for chat ID
└── new-chat/          # New conversation screen
    └── index.tsx

components/            # Reusable UI components
├── AnimatedOrb.tsx    # Animated background
├── AuthSync.tsx       # Authentication state sync
├── ChatItem.tsx       # Chat list item
├── EmojiPicker.tsx    # Emoji selection
├── EmptyUI.tsx        # Empty state display
├── MessageBubble.tsx  # Message display
├── SocketConnection.tsx  # WebSocket provider
└── UserItem.tsx       # User selection item

hooks/                 # Custom React hooks
├── useAuth.ts         # Authentication logic
├── useChats.ts        # Chat management
├── useMessages.ts     # Message handling
├── useSocialAuth.ts   # Social login handling
└── useUsers.ts        # User search

lib/                   # Core libraries
├── axios.ts           # API client configuration
└── socket.ts          # WebSocket client

types/                 # TypeScript definitions
└── index.ts           # Shared type definitions
```

### Navigation Structure

```
Auth Flow (not authenticated)
├── Login Screen → Clerk OAuth

App Flow (authenticated)
├── Tab Navigator
│   ├── Chats Tab
│   │   ├── Chat List (Home)
│   │   ├── Chat Detail (push)
│   │   └── New Chat (push)
│   └── Profile Tab
│       └── User Profile
```

---

## Features

### Authentication
- Clerk OAuth integration (Google, email, etc.)
- Secure session management
- Automatic token refresh
- Protected routes with redirect

### Real-Time Messaging
- Instant message delivery via WebSocket
- Typing indicators (send and receive)
- Online/offline presence
- Optimistic updates for instant feedback
- Automatic message polling as fallback

### Chat Management
- View all conversations
- Create new conversations
- Real-time chat list updates
- Last message preview
- Unread message count

### User Experience
- Pull-to-refresh on chat list
- Infinite scroll for message history
- Keyboard avoiding view
- Safe area handling (notch, home indicator)
- Haptic feedback on actions

### File Sharing
- Image picker integration
- File type validation
- Upload progress indicator
- Image preview before send

### UI/UX
- Modern, clean design
- Consistent styling with Tailwind
- Smooth animations
- Loading states
- Error handling with user feedback

---

## Challenges Faced

### Challenge 1: WebSocket Reconnection

**Problem:** The WebSocket connection would drop when the app went to background, and reconnecting required careful handling to avoid duplicate messages or missed updates.

**Solution:** Implemented a robust reconnection strategy:

```typescript
// In socket.ts
useEffect(() => {
  const connect = () => {
    socket.connect();
  };

  const disconnect = () => {
    socket.disconnect();
  };

  // App lifecycle events
  const subscription = AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'active') {
      connect();
    } else {
      disconnect();
    }
  });

  return () => subscription.remove();
}, []);
```

**What I Learned:** Mobile apps have different lifecycle considerations than web apps. Always handle app state changes explicitly for real-time features.

### Challenge 2: Keyboard Handling

**Problem:** The keyboard would cover the message input or push content off-screen on different Android devices with varying screen sizes and keyboard heights.

**Solution:** Used `KeyboardAvoidingView` with platform-specific configuration:

```tsx
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  keyboardVerticalOffset={90}
>
  {/* Chat input components */}
</KeyboardAvoidingView>
```

**What I Learned:** Cross-platform development requires testing on multiple devices and handling platform-specific behaviors.

### Challenge 3: Navigation State with Authentication

**Problem:** Users needed to be redirected to login when not authenticated, but navigation state needed to be preserved so they could return to their previous location after logging in.

**Solution:** Implemented AuthSync component that:
1. Checks authentication state on app launch
2. Redirects to auth if needed
3. Stores intended destination before redirect
4. Navigates back after successful authentication

**What I Learned:** Authentication and navigation need to work together seamlessly. Using React Context for auth state makes this integration cleaner.

---

## What I Learned

### Technical Lessons

1. **Expo Router:** File-based routing in Expo simplifies navigation setup and provides excellent TypeScript support.

2. **React Native Specifics:** Unlike React web, React Native requires thinking about native components, platform-specific APIs, and different interaction patterns.

3. **Real-Time on Mobile:** Mobile networks are less stable than WiFi, requiring robust reconnection logic and offline handling.

### Workflow Lessons

1. **Environment Configuration:** Expo's environment variable system (EXPO_PUBLIC_*) is essential for sharing configuration between app and API.

2. **Build & Deploy:** EAS (Expo Application Services) makes building and deploying to app stores much more accessible.

### Code Organization Lessons

1. **Custom Hooks:** Extracting business logic into custom hooks keeps components clean and reusable.

2. **TypeScript Types:** Sharing types between projects (or defining them once) ensures consistency.

3. **Component Composition:** Building small, reusable components makes the codebase more maintainable.

---

## Future Improvements

### Short Term
- [ ] Push notifications
- [ ] Message read receipts
- [ ] Message reactions
- [ ] Offline message queue

### Long Term
- [ ] Voice messages
- [ ] Video calling
- [ ] Group chats
- [ ] Message search
- [ ] End-to-end encryption

---

## Installation

### Prerequisites
- Node.js 18+
- Expo CLI
- MongoDB backend running
- Clerk account

### Setup

```bash
# Install dependencies
npm install

# Create environment file
cat > .env << EOF
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
EXPO_PUBLIC_API_URL=http://your-api-url
EOF

# Start development server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android
```

### Building for Production

```bash
# Generate native projects
npx expo prebuild

# Build iOS
eas build -p ios --profile production

# Build Android
eas build -p android --profile production
```

---

## Tech Stack

![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=flat&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat&logo=socket.io&logoColor=white)
![Clerk](https://img.shields.io/badge/Clerk-6C47FF?style=flat&logo=&logoColor=white)

---

## Screenshots

The mobile app features:
- Clean chat list with user avatars
- Modern message bubbles
- Typing indicators
- File/image sharing
- Pull-to-refresh
- Smooth animations

---

## Related Projects

- [ChatDav Backend](./backend) - Node.js API server
- [ChatDav Web](./web) - React web application

---

## License

MIT License
