import mongoose from 'mongoose';

const TestimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    company: { type: String, required: true },
    companyLink: { type: String },
    avatar: { type: String },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    content: { type: String, required: true },
    project: { type: String },
    projectLink: { type: String },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Robust export pattern for HMR compatibility
const Testimonial = mongoose.models.Testimonial || mongoose.model('Testimonial', TestimonialSchema);
export default Testimonial;
