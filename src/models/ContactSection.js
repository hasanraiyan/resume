import mongoose from 'mongoose';

const ContactSectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      default: "Let's Build.",
    },
    subtitle: {
      type: String,
      required: true,
      default: 'Something Amazing',
    },
    description: {
      type: String,
      required: true,
      default: 'Turning complex requirements into elegant, functional software.',
    },
    calendlyUrl: {
      type: String,
      default: '',
    },
    successMessage: {
      type: String,
      default: 'Thank you! Your message has been sent successfully.',
    },
    errorMessage: {
      type: String,
      default: 'Oops! Something went wrong. Please try again.',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

ContactSectionSchema.pre('save', async function (next) {
  if (this.isActive) {
    await this.constructor.updateMany({ _id: { $ne: this._id } }, { isActive: false });
  }
  next();
});

ContactSectionSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ isActive: true }).lean();
  if (!settings) {
    settings = (await this.create({})).toObject();
  }
  return settings;
};

const ContactSection =
  mongoose.models.ContactSection || mongoose.model('ContactSection', ContactSectionSchema);

if (!ContactSection.getSettings) {
  ContactSection.getSettings = async function () {
    let settings = await this.findOne({ isActive: true }).lean();
    if (!settings) {
      settings = (await this.create({})).toObject();
    }
    return settings;
  };
}

export default ContactSection;
