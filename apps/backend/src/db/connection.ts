import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/tradeOS";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

async function connectDB() {
  // Check if MongoDB URI is set
  if (!MONGODB_URI || MONGODB_URI === "mongodb://localhost:27017/tradeOS") {
    console.warn(
      "⚠️  MONGODB_URI not set. Using default: mongodb://localhost:27017/tradeOS"
    );
    console.warn(
      "⚠️  Make sure MongoDB is running locally or set MONGODB_URI environment variable"
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        console.log("✅ MongoDB connected successfully");
        console.log(`📊 Database: ${mongooseInstance.connection.name}`);
        cached.conn = mongooseInstance;
        return mongooseInstance;
      })
      .catch((error) => {
        console.error("❌ MongoDB connection error:", error.message);
        console.error("💡 Make sure MongoDB is running:");
        console.error(
          "   - Local: mongod or brew services start mongodb-community"
        );
        console.error("   - Or set MONGODB_URI to a remote MongoDB instance");
        console.error(
          "   - Or use MongoDB Atlas: mongodb+srv://user:pass@cluster.mongodb.net/db"
        );
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("❌ Failed to establish MongoDB connection");
    throw e;
  }

  return cached.conn;
}

export default connectDB;
