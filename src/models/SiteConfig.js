import mongoose from 'mongoose';

const SiteConfigSchema = new mongoose.Schema(
  {
    siteName: {
      type: String,
      required: true,
      default: 'Portfolio',
    },
    tagline: {
      type: String,
      default: 'Digital Excellence',
    },
    ownerName: {
      type: String,
      required: true,
      default: 'Admin',
    },
    baseUrl: {
      type: String,
      default: 'http://localhost:3000',
    },
    seo: {
      description: {
        type: String,
        default: 'Expert web development and design portfolio.',
      },
      keywords: {
        type: [String],
        default: ['Web Developer', 'Next.js', 'React'],
      },
      googleVerificationToken: {
        type: String,
        default: '',
      },
      twitterHandle: {
        type: String,
        default: '@handle',
      },
    },
    contact: {
      email: { type: String },
      phone: { type: String },
      address: { type: String },
    },
    // Navigation & Branding
    navigation: [
      {
        id: { type: Number },
        label: { type: String },
        href: { type: String },
      },
    ],
    navbarCta: {
      text: { type: String, default: "Let's Talk" },
      href: { type: String, default: '/#contact' },
    },

    // Footer & Newsletter
    newsletterTitle: { type: String, default: 'Stay Updated' },
    newsletterDescription: {
      type: String,
      default: 'Subscribe to our newsletter for the latest projects, articles, and insights.',
    },
    newsletterPlaceholder: { type: String, default: 'Enter your email address' },
    newsletterButtonText: { type: String, default: 'Subscribe' },
    privacyText: {
      type: String,
      default:
        "Join our newsletter for updates on new projects, articles, and insights. We respect your privacy and won't spam you.",
    },

    googleAnalyticsId: { type: String },
    footerText: { type: String },
    logo: {
      url: {
        type: String,
        default: '',
      },
      favicon: {
        type: String,
        default: '',
      },
    },
    footer: {
      copyrightText: {
        type: String,
        default: '© All rights reserved.',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

SiteConfigSchema.pre('save', async function (next) {
  if (this.isActive) {
    await this.constructor.updateMany({ _id: { $ne: this._id } }, { isActive: false });
  }
  next();
});

SiteConfigSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ isActive: true });
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const SiteConfig = mongoose.models.SiteConfig || mongoose.model('SiteConfig', SiteConfigSchema);

if (!SiteConfig.getSettings) {
  SiteConfig.getSettings = async function () {
    let settings = await this.findOne({ isActive: true }).lean();
    if (!settings) {
      settings = (await this.create({})).toObject();
    }
    return settings;
  };
}

export default SiteConfig;
