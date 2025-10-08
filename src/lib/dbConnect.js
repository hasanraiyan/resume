/**
 * @fileoverview MongoDB database connection utility with connection caching.
 * Implements a singleton pattern to reuse database connections across
 * serverless function invocations in Next.js.
 */

// src/lib/dbConnect.js
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Establishes a connection to MongoDB using Mongoose.
 * Caches the connection globally to avoid creating new connections on each request.
 * This is especially important in serverless environments like Vercel.
 *
 * @async
 * @function dbConnect
 * @returns {Promise<typeof mongoose>} Mongoose connection instance
 * @throws {Error} If MONGODB_URI is not defined
 */
async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
