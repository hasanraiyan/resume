import mongoose from 'mongoose';

const ResourceSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['video', 'article', 'doc', 'other'], default: 'other' },
    url: { type: String, default: '' },
    title: { type: String, default: '' },
  },
  { _id: false }
);

const CoursifySectionSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CoursifyCourse',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    resources: {
      type: [ResourceSchema],
      default: [],
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
    syncVersion: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.models.CoursifySection ||
  mongoose.model('CoursifySection', CoursifySectionSchema);
