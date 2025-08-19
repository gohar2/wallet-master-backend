import { randomUUID } from "crypto";

export class MemStorage {
  constructor() {
    this.users = new Map();
    this.transactions = new Map();
  }

  async getUser(id) {
    return this.users.get(id);
  }

  async getUserByEmail(email) {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  async getUserByGoogleId(googleId) {
    return Array.from(this.users.values()).find(
      (user) => user.googleId === googleId
    );
  }

  async createUser(insertUser) {
    const id = randomUUID();
    const user = {
      ...insertUser,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserWallet(id, walletAddress) {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, walletAddress };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getTransactionsByUserId(userId) {
    return Array.from(this.transactions.values())
      .filter((tx) => tx.userId === userId)
      .sort(
        (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
      );
  }

  async getTransaction(id) {
    return this.transactions.get(id);
  }

  async createTransaction(insertTransaction) {
    const id = randomUUID();
    const transaction = {
      ...insertTransaction,
      id,
      status: "pending",
      gasless: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransaction(id, updates) {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;

    const updatedTransaction = {
      ...transaction,
      ...updates,
      updatedAt: new Date(),
    };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }
  async updateUser(id, updates) {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date(), // Add this field if you want to track updates
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
}

export const storage = new MemStorage();
