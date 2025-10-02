import mongoose from 'mongoose'

const HeroSectionSchema = new mongoose.Schema({
  badge: {
    text: {
      type: String,
      required: true,
      default: 'CREATIVE DEVELOPER'
    }
  },
  
  heading: {
    line1: {
      type: String,
      required: true,
      default: 'Crafting'
    },
    line2: {
      type: String,
      required: true,
      default: 'Digital'
    },
    line3: {
      type: String,
      required: true,
      default: 'Excellence'
    }
  },
  
  introduction: {
    text: {
      type: String,
      required: true,
      default: "I'm John Doe, a creative developer focused on building beautiful and functional digital experiences that make a difference."
    },
    name: {
      type: String,
      required: true,
      default: 'John Doe'
    },
    role: {
      type: String,
      required: true,
      default: 'creative developer'
    }
  },
  
  cta: {
    primary: {
      text: {
        type: String,
        required: true,
        default: 'View My Work'
      },
      link: {
        type: String,
        required: true,
        default: '#work'
      }
    },
    secondary: {
      text: {
        type: String,
        required: true,
        default: 'Contact Me'
      },
      link: {
        type: String,
        required: true,
        default: '#contact'
      }
    }
  },
  
  socialLinks: [{
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: true
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  
  profile: {
    image: {
      url: {
        type: String,
        required: true,
        default: 'https://api.dicebear.com/7.x/personas/svg?seed=Creative'
      },
      alt: {
        type: String,
        required: true,
        default: 'Portrait'
      }
    },
    badge: {
      value: {
        type: String,
        required: true,
        default: '5+'
      },
      label: {
        type: String,
        required: true,
        default: 'Years Experience'
      }
    }
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Ensure only one active hero section at a time
HeroSectionSchema.pre('save', async function(next) {
  if (this.isActive) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { isActive: false }
    )
  }
  next()
})

// Default data seeding method
HeroSectionSchema.statics.seedDefault = async function() {
  const existingHero = await this.findOne({ isActive: true })
  
  if (!existingHero) {
    const defaultHero = new this({
      socialLinks: [
        {
          name: 'Dribbble',
          url: 'https://dribbble.com/yourusername',
          icon: 'fab fa-dribbble',
          order: 1
        },
        {
          name: 'Behance',
          url: 'https://behance.net/yourusername',
          icon: 'fab fa-behance',
          order: 2
        },
        {
          name: 'Instagram',
          url: 'https://instagram.com/yourusername',
          icon: 'fab fa-instagram',
          order: 3
        },
        {
          name: 'LinkedIn',
          url: 'https://linkedin.com/in/yourusername',
          icon: 'fab fa-linkedin',
          order: 4
        }
      ]
    })
    
    await defaultHero.save()
    return defaultHero
  }
  
  return existingHero
}

export default mongoose.models.HeroSection || mongoose.model('HeroSection', HeroSectionSchema)
