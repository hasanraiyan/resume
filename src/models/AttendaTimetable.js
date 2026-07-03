import mongoose from 'mongoose';

const TimetableSlotSchema = new mongoose.Schema(
  {
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendaSubject' },
    startTime: { type: String, default: '' },
    endTime: { type: String, default: '' },
  },
  { _id: true }
);

const DaySlotsSchema = new mongoose.Schema(
  {
    dayOfWeek: { type: Number, required: true }, // 0-6
    slots: [TimetableSlotSchema],
  },
  { _id: false }
);

const AttendaTimetableSchema = new mongoose.Schema(
  {
    semesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendaSemester',
      required: true,
      unique: true,
    },
    days: [DaySlotsSchema],
    deletedAt: { type: Date, default: null },
    syncVersion: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export default mongoose.models.AttendaTimetable ||
  mongoose.model('AttendaTimetable', AttendaTimetableSchema);
