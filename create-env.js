import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, ".env");

// Check if .env already exists
if (fs.existsSync(envPath)) {
  console.log("⚠️  .env file already exists. Skipping creation.");
  console.log("💡 If you need to update it, edit the .env file manually.");
  process.exit(0);
}

// Create .env template
const envTemplate = `# MongoDB Configuration
# For local MongoDB (make sure MongoDB is running)
MONGODB_URI=mongodb://localhost:27017/wallet-master

# For MongoDB Atlas (recommended for development)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/wallet-master?retryWrites=true&w=majority

# JWT Secret (change this to a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Google OAuth (optional - for Google authentication)
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret

# CORS Origins (comma-separated list of allowed origins)
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Environment
NODE_ENV=development

# Port (optional - defaults to 3001)
# PORT=3001
`;

try {
  fs.writeFileSync(envPath, envTemplate);
  console.log("✅ Created .env file successfully!");
  console.log("💡 Please update the MONGODB_URI and JWT_SECRET values:");
  console.log("   - For local MongoDB: Make sure MongoDB is running");
  console.log(
    "   - For MongoDB Atlas: Follow the setup guide in setup-mongodb.md"
  );
  console.log("   - JWT_SECRET: Change to a secure random string");
} catch (error) {
  console.error("❌ Error creating .env file:", error.message);
  console.log(
    "💡 Please create a .env file manually with the required variables."
  );
}
