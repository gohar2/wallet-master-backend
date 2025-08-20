# Wallet Master Backend

A Node.js backend API for a Web3 wallet application with Google OAuth authentication and gasless transactions.

## Features

- Google OAuth authentication
- JWT-based stateless authentication
- MongoDB database integration
- Gasless transaction support
- CORS-enabled API
- User wallet management

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Google OAuth credentials (optional)

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd wallet-master-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/wallet-master
   
   # For production, use MongoDB Atlas or other cloud MongoDB service
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/wallet-master?retryWrites=true&w=majority
   
   # JWT Secret
   JWT_SECRET=your-super-secret-jwt-key-here
   
   # Google OAuth (if using)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   
   # CORS Origins (comma-separated)
   CORS_ORIGIN=http://localhost:3000,http://localhost:5173
   
   # Environment
   NODE_ENV=development
   ```

4. **MongoDB Setup**
   
   **Option A: Local MongoDB**
   - Install MongoDB locally
   - Start MongoDB service
   - Use `MONGODB_URI=mongodb://localhost:27017/wallet-master`
   
   **Option B: MongoDB Atlas (Cloud)**
   - Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a new cluster
   - Get your connection string
   - Use `MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/wallet-master?retryWrites=true&w=majority`

5. **Start the server**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/google` - Google OAuth login/register
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/validate` - Validate current session
- `GET /api/auth/me` - Get current user

### User Management
- `GET /api/user/profile` - Get current user profile
- `PUT /api/user/wallet` - Update current user's wallet address
- `PATCH /api/user/wallet` - Update current user's wallet address (alternative)
- `GET /api/user/transactions` - Get current user's transactions

### Transactions
- `POST /api/transactions` - Create new transaction
- `GET /api/transactions` - Get user transactions
- `GET /api/transactions/:id` - Get specific transaction
- `PUT /api/transactions/:id` - Update transaction

### Health Check
- `GET /health` - Server health status

## Database Models

### User Model
- `email` (required, unique)
- `googleId` (unique)
- `name` (required)
- `picture`
- `walletAddress`
- `createdAt`, `updatedAt`

### Transaction Model
- `userId` (required, references User)
- `to` (required)
- `data` (required)
- `value` (default: '0')
- `status` (enum: pending, processing, completed, failed)
- `gasless` (default: true)
- `hash`
- `error`
- `createdAt`, `updatedAt`

## Development

The application uses:
- **Express.js** for the web framework
- **Mongoose** for MongoDB ODM
- **JWT** for authentication
- **Zod** for request validation
- **CORS** for cross-origin requests

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a production MongoDB instance
3. Set a strong `JWT_SECRET`
4. Configure proper CORS origins
5. Use environment variables for all sensitive data

## Error Handling

The application includes comprehensive error handling:
- Database connection errors
- Validation errors
- Authentication errors
- CORS errors
- General server errors

All errors are logged and return appropriate HTTP status codes with descriptive messages. 