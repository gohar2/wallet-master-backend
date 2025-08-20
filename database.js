import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/wallet-master";

export async function connectDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    console.log("");
    console.log("💡 To fix this issue:");
    console.log("   1. Install MongoDB locally, OR");
    console.log("   2. Use MongoDB Atlas (free cloud service)");
    console.log("");
    console.log("📖 Setup instructions:");
    console.log("   - Read setup-mongodb.md for detailed instructions");
    console.log("   - Run: npm run setup to create .env file");
    console.log("");
    console.log("🔧 Quick MongoDB Atlas setup:");
    console.log("   1. Go to https://www.mongodb.com/atlas");
    console.log("   2. Create free account and cluster");
    console.log("   3. Get connection string and update MONGODB_URI in .env");
    console.log("");
    console.log("🔄 For local MongoDB:");
    console.log(
      "   - Download from https://www.mongodb.com/try/download/community"
    );
    console.log("   - Install and start MongoDB service");
    console.log("");
    process.exit(1);
  }
}

export async function disconnectDatabase() {
  try {
    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error disconnecting from MongoDB:", error);
  }
}

// Handle connection events
mongoose.connection.on("error", (error) => {
  console.error("❌ MongoDB connection error:", error);
});

mongoose.connection.on("disconnected", () => {
  console.log("⚠️ MongoDB disconnected");
});

process.on("SIGINT", async () => {
  await disconnectDatabase();
  process.exit(0);
});
