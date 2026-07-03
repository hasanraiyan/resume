import mongoose from 'mongoose';

const LectureSubSchema = new mongoose.Schema(
  {
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendaSubject' },
    status: {
      type: String,
      enum: ['present', 'absent', 'cancelled', 'didnt-happen', 'holiday', 'college-closed'],
      default: 'present',
    },
    isExtra: { type: Boolean, default: false },
    startTime: { type: String, default: '' },
    endTime: { type: String, default: '' },
  },
  { _id: true }
);

const AttendaDaySchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // YYYY-MM-DD
    semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendaSemester', required: true },
    collegeStatus: {
      type: String,
      enum: ['present', 'absent', 'holiday', 'closed'],
      default: 'present',
    },
    lectures: [LectureSubSchema],
    notes: { type: String, default: '' },
    deletedAt: { type: Date, default: null },
    syncVersion: { type: Number, default: 1 },
  },
  { timestamps: true }
);

AttendaDaySchema.index({ date: 1, semesterId: 1 }, { unique: true });

export default mongoose.models.AttendaDay || mongoose.model('AttendaDay', AttendaDaySchema);
