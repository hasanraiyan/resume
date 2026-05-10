import mongoose from 'mongoose';

/**
 * Global cache for MongoDB connection.
 * Stores the active connection and promise to avoid duplicate connection attempts.
 * @type {{ conn: typeof mongoose | null, promise: Promise<typeof mongoose> | null }}
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Establishes a connection to MongoDB using Mongoose with connection caching.
 */
async function dbConnect() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined.');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(uri, opts).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
