import mongoose from 'mongoose';

const ResourceSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['video', 'article', 'doc', 'other'], default: 'other' },
    url: { type: String, default: '' },
    title: { type: String, default: '' },
  },
  { _id: false }
);

const QuizQuestionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['multiple_choice', 'true_false', 'short_answer', 'multi_select'],
      required: true,
    },
    question: { type: String, required: true, default: '' },
    options: { type: [String], default: [] },
    correctAnswer: { type: mongoose.Schema.Types.Mixed, default: null },
    explanation: { type: String, default: '' },
    points: { type: Number, default: 1 },
  },
  { _id: true }
);

const StepSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    content: { type: String, default: '' },
  },
  { _id: false }
);

const BlockSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['MdBlock', 'QuizBlock', 'VideoBlock', 'ResourceBlock', 'StepByStepBlock'],
      required: true,
    },
    // Markdown content
    content: { type: String, default: '' },
    // Quiz content
    quiz: {
      questions: { type: [QuizQuestionSchema], default: [] },
    },
    // Video content
    video: {
      url: { type: String, default: '' },
      title: { type: String, default: '' },
      platform: {
        type: String,
        enum: ['youtube', 'gdrive', 'vimeo', 'other'],
        default: 'youtube',
      },
    },
    // Resource content
    resource: {
      url: { type: String, default: '' },
      title: { type: String, default: '' },
      type: { type: String, enum: ['video', 'article', 'doc', 'other'], default: 'other' },
    },
    // StepByStep content
    steps: {
      type: [StepSchema],
      default: [],
    },
    order: { type: Number, default: 0 },
  },
  { _id: true, timestamps: true }
);

const CoursifySectionSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CoursifyCourse',
      required: true,
      index: true,
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CoursifyModule',
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    blocks: {
      type: [BlockSchema],
      default: [],
    },
    summary: {
      type: String,
      default: '',
    },
    learningGoals: {
      type: [String],
      default: [],
    },
    estimatedDuration: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    status: {
      type: String,
      enum: ['planned', 'draft', 'needs_review', 'complete'],
      default: 'draft',
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
  { timestamps: true, minimize: false }
);

// Force model re-creation to pick up schema changes in dev
if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.CoursifySection;
}

export default mongoose.models.CoursifySection ||
  mongoose.model('CoursifySection', CoursifySectionSchema);
