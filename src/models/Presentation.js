import mongoose from 'mongoose';

const slideSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true,
  },
  prompt: {
    type: String,
    required: true,
  },
  fallbackText: {
    type: String,
    required: true,
  },
});

const presentationSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      required: true,
    },
    outline: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    slides: {
      type: [slideSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['draft', 'completed', 'failed'],
      default: 'draft',
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Presentation =
  mongoose.models.Presentation || mongoose.model('Presentation', presentationSchema);

export default Presentation;
