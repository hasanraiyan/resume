import mongoose from 'mongoose';

const AttendaSemesterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    requiredAttendance: { type: Number, default: 75 },
    weeklyHolidays: { type: [Number], default: [0] },
    institutionName: { type: String, default: '' },
    notes: { type: String, default: '' },
    deletedAt: { type: Date, default: null },
    syncVersion: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export default mongoose.models.AttendaSemester ||
  mongoose.model('AttendaSemester', AttendaSemesterSchema);
