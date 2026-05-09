import mongoose from 'mongoose';

const DrivelySettingsSchema = new mongoose.Schema(
  {
    autoEmptyTrash: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

DrivelySettingsSchema.pre('save', async function (next) {
  if (this.isActive) {
    await this.constructor.updateMany({ _id: { $ne: this._id } }, { isActive: false });
  }
  next();
});

DrivelySettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ isActive: true });
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const DrivelySettings =
  mongoose.models.DrivelySettings || mongoose.model('DrivelySettings', DrivelySettingsSchema);

export default DrivelySettings;
