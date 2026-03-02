import { useState, useRef, useEffect } from "react";
import { SendIcon, SmileIcon, PaperclipIcon } from "lucide-react";
import EmojiPicker from "emoji-picker-react";

export function ChatInput({ value, onChange, onSubmit, disabled, onFileSelect }) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const pickerRef = useRef(null);

  const handleEmojiClick = (emojiObject) => {
    onChange({ target: { value: value + emojiObject.emoji } });
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
      // Reset the input
      event.target.value = "";
    }
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  return (
    <div className="relative">
      {showEmojiPicker && (
        <div 
          ref={pickerRef}
          className="absolute bottom-16 right-0 z-50"
        >
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme="dark"
            width={300}
            height={400}
            previewEmoji=""
            skinTonesDisabled
            searchDisabled={false}
          />
        </div>
      )}
      <form onSubmit={onSubmit} className="p-4 border-t border-base-300">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-ghost btn-circle"
            title="Attach file"
          >
            <PaperclipIcon className="size-5 text-base-content/70" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="btn btn-ghost btn-circle"
          >
            <SmileIcon className="size-5 text-amber-400" />
          </button>
          <input
            type="text"
            value={value}
            onChange={onChange}
            placeholder="Type a message..."
            className="input input-bordered flex-1 rounded-xl bg-base-300/40 border-base-300 placeholder:text-base-content/60"
          />
          <button
            type="submit"
            disabled={disabled}
            className="btn rounded-xl bg-linear-to-r from-amber-500 to-orange-500 border-none disabled:btn-disabled"
          >
            <SendIcon className="size-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
