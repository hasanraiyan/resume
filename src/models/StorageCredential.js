import mongoose from 'mongoose';
import { encrypt, decrypt } from '@/lib/crypto';

const StorageCredentialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    provider: {
      type: String,
      required: true,
      enum: ['uploadthing', 's3', 'cloudinary'],
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    // Store credentials as an encrypted string.
    // The getter/setter encrypts the JSON object.
    credentials: {
      type: String,
      required: true,
      set: (val) => {
        if (typeof val === 'object') {
          return encrypt(JSON.stringify(val));
        }
        return val;
      },
      get: (val) => {
        if (!val) return null;
        try {
          const decrypted = decrypt(val);
          return decrypted ? JSON.parse(decrypted) : null;
        } catch (e) {
          return null;
        }
      },
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

export default mongoose.models.StorageCredential ||
  mongoose.model('StorageCredential', StorageCredentialSchema);
