import mongoose from 'mongoose';

const SyllabusItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started',
  },
  completedAt: { type: Date, default: null },
});

const AttendaSubjectSchema = new mongoose.Schema(
  {
    semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendaSemester', required: true },
    name: { type: String, required: true },
    facultyName: { type: String, default: '' },
    color: { type: String, default: '#4a86e8' },
    credits: { type: Number, default: null },
    requiredAttendance: { type: Number, default: 75 },
    isActive: { type: Boolean, default: true },
    syllabus: { type: [SyllabusItemSchema], default: [] },
    deletedAt: { type: Date, default: null },
    syncVersion: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export default mongoose.models.AttendaSubject ||
  mongoose.model('AttendaSubject', AttendaSubjectSchema);
