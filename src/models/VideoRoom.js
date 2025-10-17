// src/models/VideoRoom.js

import mongoose from 'mongoose';

const SignalSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  type: { type: String, enum: ['offer', 'answer', 'candidate'], required: true },
  payload: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now },
});

const VideoRoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true, index: true },
  participants: [{ type: String }], // Store unique IDs for each participant
  signals: [SignalSchema],
  createdAt: { type: Date, default: Date.now, expires: '1h' }, // TTL index: auto-delete rooms after 1 hour
});

export default mongoose.models.VideoRoom || mongoose.model('VideoRoom', VideoRoomSchema);
