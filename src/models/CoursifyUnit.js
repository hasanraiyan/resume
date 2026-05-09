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

const VideoBlockSchema = new mongoose.Schema(
  {
    videoUrl: { type: String, default: '' },
    duration: { type: String, default: '' },
    thumbnailUrl: { type: String, default: '' },
  },
  { _id: true }
);

const ArticleBlockSchema = new mongoose.Schema(
  {
    content: { type: String, default: '' },
    attachments: { type: [ResourceSchema], default: [] },
  },
  { _id: true }
);

const BlockSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['video', 'article', 'quiz'], required: true },
    video: VideoBlockSchema,
    article: ArticleBlockSchema,
    quiz: {
      questions: { type: [QuizQuestionSchema], default: [] },
      passingScore: { type: Number, default: 80 },
    },
  },
  { _id: true }
);

const CoursifyUnitSchema = new mongoose.Schema(
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
    sectionType: {
      type: String,
      enum: ['lesson', 'quiz'],
      default: 'lesson',
    },
    content: {
      type: String,
      default: '',
    },
    quiz: {
      questions: { type: [QuizQuestionSchema], default: [] },
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
    completionStatus: {
      type: String,
      enum: ['not_started', 'in_progress', 'complete'],
      default: 'not_started',
      index: true,
    },
    blocks: {
      type: [BlockSchema],
      default: [],
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

export default mongoose.models.CoursifyUnit || mongoose.model('CoursifyUnit', CoursifyUnitSchema);
