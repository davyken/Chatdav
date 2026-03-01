import EmptyUI from "@/components/EmptyUI";
import MessageBubble from "@/components/MessageBubble";
import EmojiPicker from "@/components/EmojiPicker";
import { useCurrentUser } from "@/hooks/useAuth";
import { useMessages } from "@/hooks/useMessages";
import { useSocketStore } from "@/lib/socket";
import { MessageSender } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

type ChatParams = {
  id: string;
  participantId: string;
  name: string;
  avatar: string;
};

const ChatDetailScreen = () => {
  const { id: chatId, avatar, name, participantId } = useLocalSearchParams<ChatParams>();

  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const { data: currentUser } = useCurrentUser();
  const { data: messages, isLoading } = useMessages(chatId);

  const { joinChat, leaveChat, sendMessage, sendTyping, isConnected, onlineUsers, typingUsers, call, startCall, acceptCall, rejectCall, endCall } =
    useSocketStore();

  const isOnline = participantId ? onlineUsers.has(participantId) : false;
  const isTyping = typingUsers.get(chatId) === participantId;

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // join chat room on mount, leave on unmount
  useEffect(() => {
    if (chatId && isConnected) joinChat(chatId);

    return () => {
      if (chatId) leaveChat(chatId);
    };
  }, [chatId, isConnected, joinChat, leaveChat]);

  // scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleTyping = useCallback(
    (text: string) => {
      setMessageText(text);

      if (!isConnected || !chatId) return;

      // send typing start
      if (text.length > 0) {
        sendTyping(chatId, true);

        // clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // stop typing after 2 seconds of no input
        typingTimeoutRef.current = setTimeout(() => {
          sendTyping(chatId, false);
        }, 2000);
      } else {
        // text cleared, stop typing
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        sendTyping(chatId, false);
      }
    },
    [chatId, isConnected, sendTyping]
  );

  const handleSend = () => {
    console.log({ isSending, isConnected, currentUser, messageText });
    if (!messageText.trim() || isSending || !isConnected || !currentUser) return;

    // stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendTyping(chatId, false);

    setIsSending(true);
    sendMessage(chatId, messageText.trim(), {
      _id: currentUser._id,
      name: currentUser.name,
      email: currentUser.email,
      avatar: currentUser.avatar,
    });
    setMessageText("");
    setShowEmojiPicker(false);
    setIsSending(false);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageText((prev) => prev + emoji);
  };

  const handleAudioCall = () => {
    Alert.alert("Coming Soon", "Audio calling will be available soon!");
    // if (participantId) {
    //   startCall(participantId, "audio", chatId);
    // }
  };

  const handleVideoCall = () => {
    Alert.alert("Coming Soon", "Video calling will be available soon!");
    // if (participantId) {
    //   startCall(participantId, "video", chatId);
    // }
  };

  const handleFilePick = async () => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Please allow access to your photo library to send files.");
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // Upload the file
        handleUploadFile(asset.uri, asset.fileName || "file", asset.type || "image");
      }
    } catch (error) {
      console.error("Error picking file:", error);
      Alert.alert("Error", "Failed to pick file. Please try again.");
    }
  };

  const handleCameraCapture = async () => {
    try {
      // Request camera permissions
      const cameraPermissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPermissionResult.granted) {
        Alert.alert("Permission Required", "Please allow access to your camera to take photos.");
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // Upload the photo
        const filename = `photo_${Date.now()}.jpg`;
        handleUploadFile(asset.uri, filename, "image");
      }
    } catch (error) {
      console.error("Error capturing photo:", error);
      Alert.alert("Error", "Failed to capture photo. Please try again.");
    }
  };

  const handleUploadFile = async (uri: string, filename: string, type: string) => {
    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append("file", {
        uri,
        name: filename,
        type: type === "image" ? `image/${filename.split(".").pop()}` : "application/octet-stream",
      } as any);
      formData.append("chatId", chatId);

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/messages/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      // The message will be added via socket, but we can also update locally
    } catch (error) {
      console.error("Error uploading file:", error);
      Alert.alert("Error", "Failed to upload file. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top", "bottom"]}>
      <EmojiPicker
        visible={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelect={handleEmojiSelect}
      />
      {/* Header */}
      <View className="flex-row items-center px-4 py-2 bg-surface border-b border-surface-light">
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#F4A261" />
        </Pressable>
        <View className="flex-row items-center flex-1 ml-2">
          {avatar && <Image source={avatar} style={{ width: 40, height: 40, borderRadius: 999 }} />}
          <View className="ml-3">
            <Text className="text-foreground font-semibold text-base" numberOfLines={1}>
              {name}
            </Text>
            <Text className={`text-xs ${isTyping ? "text-primary" : "text-muted-foreground"}`}>
              {isTyping ? "typing..." : isOnline ? "Online" : "Offline"}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-3">
          <Pressable 
            className="w-9 h-9 rounded-full items-center justify-center"
            onPress={handleAudioCall}
            disabled={!isOnline}
          >
            <Ionicons 
              name="call-outline" 
              size={20} 
              color={isOnline ? "#4CAF50" : "#A0A0A5"} 
            />
          </Pressable>
          <Pressable 
            className="w-9 h-9 rounded-full items-center justify-center"
            onPress={handleVideoCall}
            disabled={!isOnline}
          >
            <Ionicons 
              name="videocam-outline" 
              size={20} 
              color={isOnline ? "#2196F3" : "#A0A0A5"} 
            />
          </Pressable>
        </View>
      </View>

      {/* Message + Keyboard input */}

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View className="flex-1 bg-surface">
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#F4A261" />
            </View>
          ) : !messages || messages.length === 0 ? (
            <EmptyUI
              title="No messages yet"
              subtitle="Start the conversation!"
              iconName="chatbubbles-outline"
              iconColor="#6B6B70"
              iconSize={64}
            />
          ) : (
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
              onContentSizeChange={() => {
                scrollViewRef.current?.scrollToEnd({ animated: false });
              }}
            >
              {messages.map((message) => {
                const senderId = (message.sender as MessageSender)._id;
                const isFromMe = currentUser ? senderId === currentUser._id : false;

                return <MessageBubble key={message._id} message={message} isFromMe={isFromMe} />;
              })}
            </ScrollView>
          )}

          {/* Input bar */}
          <View className="px-3 pb-3 pt-2 bg-surface border-t border-surface-light">
            <View className="flex-row items-end bg-surface-card rounded-3xl px-3 py-1.5 gap-2">
              <Pressable 
                className="w-8 h-8 rounded-full items-center justify-center"
                onPress={handleFilePick}
              >
                <Ionicons 
                  name="attach-outline" 
                  size={22} 
                  color="#A0A0A5" 
                />
              </Pressable>

              <Pressable 
                className="w-8 h-8 rounded-full items-center justify-center"
                onPress={handleCameraCapture}
              >
                <Ionicons 
                  name="camera-outline" 
                  size={22} 
                  color="#A0A0A5" 
                />
              </Pressable>

              <Pressable 
                className="w-8 h-8 rounded-full items-center justify-center"
                onPress={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Ionicons 
                  name={showEmojiPicker ? "key" : "happy-outline"} 
                  size={22} 
                  color="#F4A261" 
                />
              </Pressable>

              <TextInput
                placeholder="Type a message"
                placeholderTextColor="#6B6B70"
                className="flex-1 text-foreground text-sm mb-2"
                multiline
                style={{ maxHeight: 100 }}
                value={messageText}
                onChangeText={handleTyping}
                onSubmitEditing={handleSend}
                editable={!isSending}
              />

              <Pressable
                className="w-8 h-8 rounded-full items-center justify-center bg-primary"
                onPress={handleSend}
                disabled={!messageText.trim() || isSending}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#0D0D0F" />
                ) : (
                  <Ionicons name="send" size={18} color="#0D0D0F" />
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Incoming Call Modal */}
      {call && call.isIncoming && !call.isAccepted && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
        >
          <View className="flex-1 bg-black/50 justify-center items-center">
            <View className="bg-surface p-6 rounded-2xl items-center mx-8">
              <Image
                source={call.caller.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"}
                style={{ width: 80, height: 80, borderRadius: 40 }}
              />
              <Text className="text-lg font-semibold mt-4 text-foreground">
                {call.caller.name} is calling
              </Text>
              <Text className="text-sm text-muted-foreground mt-1">
                {call.type === "video" ? "Incoming Video Call" : "Incoming Audio Call"}
              </Text>
              <View className="flex-row gap-8 mt-6">
                <Pressable
                  className="w-14 h-14 rounded-full bg-red-500 items-center justify-center"
                  onPress={rejectCall}
                >
                  <Ionicons name="call" size={24} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
                </Pressable>
                <Pressable
                  className="w-14 h-14 rounded-full bg-green-500 items-center justify-center"
                  onPress={acceptCall}
                >
                  <Ionicons name="call" size={24} color="white" />
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Active Call Screen */}
      {call && call.isAccepted && (
        <Modal
          visible={true}
          transparent
          animationType="slide"
        >
          <View className="flex-1 bg-surface">
            <View className="flex-1 items-center justify-center">
              <Image
                source={call.caller.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"}
                style={{ width: 100, height: 100, borderRadius: 50 }}
              />
              <Text className="text-xl font-semibold mt-4 text-foreground">
                {call.caller.name}
              </Text>
              <Text className="text-sm text-muted-foreground mt-1">
                {call.type === "video" ? "Video Call" : "Audio Call"} • Connected
              </Text>
            </View>
            <View className="p-8 items-center">
              <Pressable
                className="w-16 h-16 rounded-full bg-red-500 items-center justify-center"
                onPress={endCall}
              >
                <Ionicons name="call" size={32} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* Outgoing Call Alert */}
      {call && !call.isIncoming && !call.isAccepted && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
        >
          <View className="flex-1 bg-black/50 justify-center items-center">
            <View className="bg-surface p-6 rounded-2xl items-center mx-8">
              <Image
                source={avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"}
                style={{ width: 80, height: 80, borderRadius: 40 }}
              />
              <Text className="text-lg font-semibold mt-4 text-foreground">
                Calling {name}...
              </Text>
              <Text className="text-sm text-muted-foreground mt-1">
                {call.type === "video" ? "Video Call" : "Audio Call"}
              </Text>
              <Pressable
                className="mt-6 px-6 py-2 rounded-full bg-red-500"
                onPress={endCall}
              >
                <Text className="text-white font-semibold">Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

export default ChatDetailScreen;
