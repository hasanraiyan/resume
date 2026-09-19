import mongoose from 'mongoose';

const AttendaPairCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    ownerId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'linked', 'expired'],
      default: 'pending',
      index: true,
    },
    clientName: {
      type: String,
      default: null,
    },
    connectionId: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

AttendaPairCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.AttendaPairCode ||
  mongoose.model('AttendaPairCode', AttendaPairCodeSchema);
