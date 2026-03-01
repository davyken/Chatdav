import { Message } from "@/types";
import { View, Text, Image, TouchableOpacity, Linking } from "react-native";

function MessageBubble({ message, isFromMe }: { message: Message; isFromMe: boolean }) {
  const file = message.file;
  const hasFile = file && file.url;
  const isImage = hasFile && file.type === "image";

  const handleFilePress = () => {
    if (file?.url) {
      Linking.openURL(file.url);
    }
  };

  return (
    <View className={`flex-row ${isFromMe ? "justify-end" : "justify-start"}`}>
      <View
        className={`max-w-[80%] px-3 py-2 rounded-2xl ${
          isFromMe
            ? "bg-primary rounded-br-sm"
            : "bg-surface-card rounded-bl-sm border border-surface-light"
        }`}
      >
        {/* Image attachment */}
        {isImage && file && (
          <Image
            source={{ uri: file.url }}
            className="w-48 h-48 rounded-lg mb-2 resize-mode-cover"
            resizeMode="cover"
          />
        )}

        {/* Text content */}
        {message.text && (
          <Text className={`text-sm ${isFromMe ? "text-surface-dark" : "text-foreground"}`}>
            {message.text}
          </Text>
        )}

        {/* File attachment (non-image) */}
        {hasFile && !isImage && file && (
          <TouchableOpacity onPress={handleFilePress} className="mt-1">
            <Text className={`text-sm ${isFromMe ? "text-surface-dark underline" : "text-foreground underline"}`}>
              📎 {file.filename || "Download file"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default MessageBubble;
