import { formatTime } from "../lib/utils";

export function MessageBubble({ message, currentUser }) {
  const isMe = message.sender?._id === currentUser?._id;
  const hasFile = message.file && message.file.url;
  const isImage = hasFile && message.file.type === "image";

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-md px-4 py-2.5 rounded-2xl ${
          isMe
            ? "bg-linear-to-r from-amber-500 to-orange-500 text-primary-content"
            : "bg-base-300/40 text-base-content"
        }`}
      >
        {/* Image attachment */}
        {isImage && (
          <img 
            src={message.file.url} 
            alt={message.file.filename || "Image"} 
            className="rounded-lg max-w-full h-auto mb-2"
          />
        )}
        
        {/* Text content */}
        {message.text && <p className="text-sm">{message.text}</p>}
        
        {/* File attachment (non-image) */}
        {hasFile && !isImage && (
          <a 
            href={message.file.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`flex items-center gap-2 text-sm underline ${isMe ? "text-primary-content" : "text-base-content"}`}
          >
            📎 {message.file.filename || "Download file"}
          </a>
        )}
        
        <p className={`text-xs mt-1 ${isMe ? "text-primary-content/80" : "text-base-content/70"}`}>
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
