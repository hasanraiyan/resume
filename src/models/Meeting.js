// src/models/Meeting.js
import mongoose from 'mongoose';

const MeetingSchema = new mongoose.Schema(
  {
    meetingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Assuming an admin User model exists
    },
    // Meetings expire after 24 hours to keep the collection clean
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
      index: { expires: '1s' },
    },
  },
  { timestamps: true }
);

export default mongoose.models.Meeting || mongoose.model('Meeting', MeetingSchema);
