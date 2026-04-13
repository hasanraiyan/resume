import mongoose from 'mongoose';

const MemoscribeNoteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    text: {
      type: String,
      required: true,
    },
    vectorId: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.MemoscribeNote ||
  mongoose.model('MemoscribeNote', MemoscribeNoteSchema);
