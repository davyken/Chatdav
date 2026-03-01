import mongoose, { Schema, type Document } from "mongoose";

export interface IFile {
  url: string;
  filename: string;
  mimetype: string;
  size: number;
  type: "image" | "file";
}

export interface IMessage extends Document {
  chat: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  text: string;
  file?: IFile;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    chat: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    file: {
      url: String,
      filename: String,
      mimetype: String,
      size: Number,
      type: {
        type: String,
        enum: ["image", "file"],
      },
    },
  },
  { timestamps: true }
);

// indexes for faster queries
MessageSchema.index({ chat: 1, createdAt: 1 }); // oldest one first
// 1 - asc
// -1 -> desc

export const Message = mongoose.model("Message", MessageSchema);
