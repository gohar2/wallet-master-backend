import { User } from "./models/User.js";
import { Transaction } from "./models/Transaction.js";

export class MongoStorage {
  async getUser(id) {
    try {
      return await User.findById(id);
    } catch (error) {
      console.error("Error getting user by ID:", error);
      return null;
    }
  }

  async getUserByEmail(email) {
    try {
      return await User.findOne({ email: email.toLowerCase() });
    } catch (error) {
      console.error("Error getting user by email:", error);
      return null;
    }
  }

  async getUserByGoogleId(googleId) {
    try {
      return await User.findOne({ googleId });
    } catch (error) {
      console.error("Error getting user by Google ID:", error);
      return null;
    }
  }

  async createUser(insertUser) {
    try {
      const user = new User({
        ...insertUser,
        email: insertUser.email.toLowerCase(),
      });
      return await user.save();
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async updateUserWallet(id, walletAddress) {
    try {
      return await User.findByIdAndUpdate(
        id,
        { walletAddress },
        { new: true, runValidators: true }
      );
    } catch (error) {
      console.error("Error updating user wallet:", error);
      return null;
    }
  }

  async updateUser(id, updates) {
    try {
      return await User.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
    } catch (error) {
      console.error("Error updating user:", error);
      return null;
    }
  }

  async getTransactionsByUserId(userId) {
    try {
      return await Transaction.find({ userId })
        .sort({ createdAt: -1 })
        .populate("userId", "email name");
    } catch (error) {
      console.error("Error getting transactions by user ID:", error);
      return [];
    }
  }

  async getTransaction(id) {
    try {
      return await Transaction.findById(id).populate("userId", "email name");
    } catch (error) {
      console.error("Error getting transaction by ID:", error);
      return null;
    }
  }

  async createTransaction(insertTransaction) {
    try {
      const transaction = new Transaction({
        ...insertTransaction,
        status: "pending",
        gasless: true,
      });
      return await transaction.save();
    } catch (error) {
      console.error("Error creating transaction:", error);
      throw error;
    }
  }

  async updateTransaction(id, updates) {
    try {
      return await Transaction.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
    } catch (error) {
      console.error("Error updating transaction:", error);
      return null;
    }
  }
}

export const storage = new MongoStorage();
