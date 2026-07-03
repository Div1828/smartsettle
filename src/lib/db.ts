import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

const MONGODB_URI = process.env.MONGODB_URI;

// Global caching to prevent serverless functions from opening redundant connections
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null, mongoServer: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    // Helper to connect to a given URI
    const connectWithUri = async (uri: string) => {
      return mongoose.connect(uri, opts).then((mongooseInstance) => {
        return mongooseInstance;
      });
    };

    // If URI contains placeholder brackets, fail fast to fallback
    const isPlaceholder = MONGODB_URI && (MONGODB_URI.includes("<") || MONGODB_URI.includes(">"));

    if (MONGODB_URI && !isPlaceholder) {
      console.log("MONGODB_URI found. Connecting to primary database...");
      cached.promise = connectWithUri(MONGODB_URI).catch(async (err) => {
        console.error("PRIMARY MONGO CONNECTION FAILED. FALLING BACK TO MEMORY SERVER. Error:", err.message);
        
        // Spin up in-memory mongo server
        const mongoServer = await MongoMemoryServer.create();
        cached.mongoServer = mongoServer;
        const fallbackUri = mongoServer.getUri();
        console.log("Mock MongoDB Memory Server started at:", fallbackUri);
        return connectWithUri(fallbackUri);
      });
    } else {
      console.log("MONGODB_URI is empty or contains placeholders. Starting local MongoMemoryServer...");
      cached.promise = (async () => {
        const mongoServer = await MongoMemoryServer.create();
        cached.mongoServer = mongoServer;
        const fallbackUri = mongoServer.getUri();
        console.log("Mock MongoDB Memory Server started at:", fallbackUri);
        return connectWithUri(fallbackUri);
      })();
    }
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    console.error("RAW SYSTEM ERROR:", e);
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;