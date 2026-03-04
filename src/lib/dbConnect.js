/**
 * @fileoverview MongoDB database connection utility with connection caching.
 * Implements a singleton pattern to reuse database connections across
 * serverless function invocations in Next.js.
 *
 * This module provides a crucial database connection function that implements
 * connection pooling and caching to optimize performance in serverless environments.
 * It ensures that database connections are reused across function invocations rather
 * than creating new connections for each request.
 *
 * @example
 * ```js
 * import dbConnect from '@/lib/dbConnect';
 *
 * // In an API route or server action
 * export async function GET() {
 *   await dbConnect();
 *   const projects = await Project.find({});
 *   return Response.json(projects);
 * }
 * ```
 */

// src/lib/dbConnect.js
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn('WARNING: MONGODB_URI environment variable is not defined.');
}

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
 * Caches the connection globally to avoid creating new connections on each request.
 * This is especially important in serverless environments like Vercel where function
 * instances are created and destroyed frequently.
 *
 * The function implements a singleton-like pattern that:
 * 1. Returns existing connection if available
 * 2. Reuses pending connection promise if connection is in progress
 * 3. Creates new connection only if none exists
 *
 * Connection options:
 * - `bufferCommands: false` - Disable mongoose buffering to fail fast on connection issues
 * - Uses environment variable `MONGODB_URI` for connection string
 *
 * @async
 * @function dbConnect
 * @returns {Promise<typeof mongoose>} Mongoose connection instance
 * @throws {Error} If MONGODB_URI environment variable is not defined
 * @throws {Error} If database connection fails
 *
 * @example
 * ```js
 * // Basic usage in API routes
 * export async function GET() {
 *   try {
 *     await dbConnect();
 *     const data = await MyModel.find({});
 *     return Response.json(data);
 *   } catch (error) {
 *     console.error('Database error:', error);
 *     return Response.json({ error: 'Database connection failed' }, { status: 500 });
 *   }
 * }
 *
 * // Usage in server actions
 * export async function getProjects() {
 *   await dbConnect();
 *   return await Project.find({}).lean();
 * }
 * ```
 */
async function dbConnect() {
  if (!MONGODB_URI) {
    console.warn('Skipping dbConnect because MONGODB_URI is not set.');
    return null;
  }

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
