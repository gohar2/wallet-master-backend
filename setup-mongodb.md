# MongoDB Setup Guide

## Option 1: MongoDB Atlas (Recommended for Development)

1. **Create a free MongoDB Atlas account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Sign up for a free account

2. **Create a new cluster**
   - Choose the free tier (M0)
   - Select your preferred cloud provider and region
   - Click "Create Cluster"

3. **Set up database access**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Create a username and password (save these!)
   - Select "Read and write to any database"
   - Click "Add User"

4. **Set up network access**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Click "Confirm"

5. **Get your connection string**
   - Go back to "Database" in the left sidebar
   - Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string

6. **Update your .env file**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/wallet-master?retryWrites=true&w=majority
   ```
   Replace `username`, `password`, and `cluster` with your actual values.

## Option 2: Local MongoDB Installation

### Windows
1. **Download MongoDB Community Server**
   - Go to [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   - Download the Windows installer

2. **Install MongoDB**
   - Run the installer
   - Choose "Complete" installation
   - Install MongoDB Compass (optional but recommended)

3. **Start MongoDB service**
   - MongoDB should start automatically as a Windows service
   - If not, open Services and start "MongoDB"

4. **Test connection**
   ```bash
   mongosh
   ```

### macOS
1. **Install with Homebrew**
   ```bash
   brew tap mongodb/brew
   brew install mongodb-community
   ```

2. **Start MongoDB**
   ```bash
   brew services start mongodb/brew/mongodb-community
   ```

### Linux (Ubuntu)
1. **Install MongoDB**
   ```bash
   sudo apt update
   sudo apt install mongodb
   ```

2. **Start MongoDB**
   ```bash
   sudo systemctl start mongodb
   sudo systemctl enable mongodb
   ```

## Testing the Connection

After setting up MongoDB, test your connection:

```bash
npm run dev
```

You should see:
```
✅ Connected to MongoDB successfully
🚀 Backend server running on port 3001
```

## Troubleshooting

### Connection Refused Error
- Make sure MongoDB is running
- Check if the port 27017 is available
- Verify your connection string

### Authentication Error
- Check your username and password
- Make sure your IP is whitelisted (for Atlas)
- Verify database user permissions

### Network Error
- Check your internet connection (for Atlas)
- Verify firewall settings
- Try connecting from a different network

## Environment Variables

Make sure your `.env` file contains:

```env
# For local MongoDB
MONGODB_URI=mongodb://localhost:27017/wallet-master

# For MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/wallet-master?retryWrites=true&w=majority

# Other required variables
JWT_SECRET=your-secret-key
NODE_ENV=development
``` 