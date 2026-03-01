import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface EmojiPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}

const EMOJI_CATEGORIES = {
  "Smileys": ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "😉", "😌", "😍", "🥰", "😘", "😋", "😛", "🤔", "🤨", "😐", "😑", "😶", "🙄", "😏", "😣", "😥", "😮", "🤐", "😯", "😪", "😫", "🥱", "😴", "😌", "😷", "🤒", "🤕"],
  "Gestures": ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "👋", "🤚", "🖐️", "✋", "🖖", "👏", "🙌", "🤲", "🤝", "🙏", "✍️", "💪"],
  "Hearts": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️"],
  "Objects": ["💼", "📁", "📂", "🗂️", "📅", "📆", "🗓️", "📇", "📈", "📉", "📊", "📋", "📌", "📍", "📎", "🖇️", "📏", "📐", "✂️", "🗃️", "🗄️", "🗑️", "🔒", "🔓", "🔏", "🔐", "🔑", "🗝️"],
  "Symbols": ["✅", "❌", "❓", "❗", "💯", "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "⚫", "⚪", "🟤", "⭐", "🌟", "✨", "💫", "💥", "💢", "💬", "💭", "🔔", "🎵", "🎶", "🔥", "💯", "🙌", "👏"],
  "Nature": ["🌸", "💮", "🏵️", "🌹", "🥀", "🌺", "🌻", "🌼", "🌷", "🌱", "🌿", "☘️", "🍀", "🍁", "🍂", "🍃", "🌴", "🌵", "🌾", "🌿", "🍄", "🌰", "🐚", "🌈", "☀️", "🌤️", "⛅", "🌦️", "☁️", "🌧️", "⛈️", "🌩️", "🌨️"],
  "Food": ["🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🫑", "🌽", "🥕", "🫒", "🧄", "🧅", "🥔", "🍠"],
  "Animals": ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞"],
};

export default function EmojiPicker({ visible, onClose, onSelect }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>("Smileys");
  const categories = Object.keys(EMOJI_CATEGORIES);

  const handleEmojiSelect = (emoji: string) => {
    onSelect(emoji);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-end bg-black/50">
          <TouchableWithoutFeedback>
            <View className="bg-surface-card rounded-t-3xl max-h-[60%]">
              {/* Header */}
              <View className="flex-row items-center justify-between px-4 py-3 border-b border-surface-light">
                <Text className="text-foreground font-semibold">Emojis</Text>
                <Pressable onPress={onClose} className="p-1">
                  <Ionicons name="close" size={24} color="#A0A0A5" />
                </Pressable>
              </View>

              {/* Category tabs */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="border-b border-surface-light py-2"
                contentContainerStyle={{ paddingHorizontal: 12 }}
              >
                {categories.map((category) => (
                  <Pressable
                    key={category}
                    onPress={() => setActiveCategory(category)}
                    className={`px-3 py-1.5 rounded-full mx-1 ${
                      activeCategory === category
                        ? "bg-primary"
                        : "bg-surface-light"
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        activeCategory === category
                          ? "text-primary-content font-semibold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {category}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Emoji grid */}
              <ScrollView
                style={{ height: 200 }}
                contentContainerStyle={{ padding: 8 }}
                showsVerticalScrollIndicator={false}
              >
                <View className="flex-row flex-wrap">
                  {EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].map(
                    (emoji, index) => (
                      <Pressable
                        key={`${emoji}-${index}`}
                        onPress={() => handleEmojiSelect(emoji)}
                        className="w-[12%] aspect-square items-center justify-center"
                      >
                        <Text className="text-2xl">{emoji}</Text>
                      </Pressable>
                    )
                  )}
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
