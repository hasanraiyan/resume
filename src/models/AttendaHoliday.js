import mongoose from 'mongoose';

const AttendaHolidaySchema = new mongoose.Schema(
  {
    semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendaSemester', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    name: { type: String, required: true },
    type: { type: String, enum: ['manual', 'college'], default: 'manual' },
    deletedAt: { type: Date, default: null },
    syncVersion: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export default mongoose.models.AttendaHoliday ||
  mongoose.model('AttendaHoliday', AttendaHolidaySchema);
