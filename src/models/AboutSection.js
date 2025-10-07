import mongoose from 'mongoose';

const AboutSectionSchema = new mongoose.Schema(
  {
    sectionTitle: {
      type: String,
      required: true,
      default: 'About Me',
    },

    bio: {
      paragraphs: [
        {
          type: String,
          required: true,
          default:
            "I'm a passionate creative developer with a love for crafting exceptional digital experiences. My journey in design and development has been driven by curiosity and a constant desire to learn.",
        },
      ],
    },

    resume: {
      text: {
        type: String,
        required: true,
        default: 'Download Resume',
      },
      url: {
        type: String,
        required: true,
        default: '#',
      },
    },

    features: [
      {
        id: {
          type: Number,
          required: true,
        },
        icon: {
          type: String,
          required: true,
          default: 'fas fa-lightbulb',
        },
        title: {
          type: String,
          required: true,
          default: 'Creative',
        },
        description: {
          type: String,
          required: true,
          default: 'Innovative solutions for complex problems',
        },
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Seed default data
AboutSectionSchema.statics.seedDefault = async function () {
  const defaultData = {
    sectionTitle: 'About Me',
    bio: {
      paragraphs: [
        "I'm a passionate creative developer with a love for crafting exceptional digital experiences. My journey in design and development has been driven by curiosity and a constant desire to learn.",
        'With expertise spanning from concept to execution, I bring ideas to life through clean code, thoughtful design, and attention to detail that makes every project unique.',
        "When I'm not coding, you'll find me exploring new design trends, experimenting with new technologies, or enjoying a good cup of coffee while sketching new ideas.",
      ],
    },
    resume: {
      text: 'Download Resume',
      url: '#',
    },
    features: [
      {
        id: 1,
        icon: 'fas fa-lightbulb',
        title: 'Creative',
        description: 'Innovative solutions for complex problems',
      },
      {
        id: 2,
        icon: 'fas fa-rocket',
        title: 'Fast',
        description: 'Optimized performance and quick delivery',
      },
      {
        id: 3,
        icon: 'fas fa-mobile-alt',
        title: 'Responsive',
        description: 'Works perfectly on all devices',
      },
      {
        id: 4,
        icon: 'fas fa-code',
        title: 'Clean Code',
        description: 'Maintainable and scalable solutions',
      },
    ],
    isActive: true,
  };

  return await this.create(defaultData);
};

export default mongoose.models.AboutSection || mongoose.model('AboutSection', AboutSectionSchema);
