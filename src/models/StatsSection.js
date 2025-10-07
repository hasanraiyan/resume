import mongoose from 'mongoose';

const StatsSectionSchema = new mongoose.Schema(
  {
    heading: {
      title: {
        type: String,
        required: true,
        default: 'Our Achievements',
      },
      description: {
        type: String,
        required: true,
        default: 'Numbers that speak for themselves',
      },
    },

    stats: [
      {
        id: {
          type: Number,
          required: true,
        },
        number: {
          type: String,
          required: true,
          default: '180+',
        },
        label: {
          type: String,
          required: true,
          default: 'Projects Completed',
        },
        icon: {
          type: String,
          required: true,
          default: 'fas fa-project-diagram',
        },
        description: {
          type: String,
          required: true,
          default: 'Successfully delivered projects',
        },
      },
    ],

    animation: {
      countUp: {
        type: Boolean,
        default: true,
      },
      duration: {
        type: Number,
        default: 2000,
      },
    },

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
StatsSectionSchema.statics.seedDefault = async function () {
  const defaultData = {
    heading: {
      title: 'Our Achievements',
      description: 'Numbers that speak for themselves',
    },
    stats: [
      {
        id: 1,
        number: '180+',
        label: 'Projects Completed',
        icon: 'fas fa-project-diagram',
        description: 'Successfully delivered projects',
      },
      {
        id: 2,
        number: '75+',
        label: 'Happy Clients',
        icon: 'fas fa-smile',
        description: 'Satisfied clients worldwide',
      },
      {
        id: 3,
        number: '12+',
        label: 'Awards Won',
        icon: 'fas fa-trophy',
        description: 'Industry recognition and awards',
      },
      {
        id: 4,
        number: '5+',
        label: 'Years Experience',
        icon: 'fas fa-calendar-alt',
        description: 'Years of professional experience',
      },
    ],
    animation: {
      countUp: true,
      duration: 2000,
    },
    isActive: true,
  };

  return await this.create(defaultData);
};

export default mongoose.models.StatsSection || mongoose.model('StatsSection', StatsSectionSchema);
