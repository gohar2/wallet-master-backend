import { z } from "zod";

// User schema
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  googleId: z.string(),
  name: z.string().optional(),
  walletAddress: z.string().optional(),
  createdAt: z.date().optional(),
});

export const insertUserSchema = z.object({
  email: z.string().email(),
  googleId: z.string(),
  name: z.string().optional(),
  walletAddress: z.string().optional(),
});

// Transaction schema
export const transactionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(["transfer", "batch"]),
  status: z.enum(["pending", "success", "failed"]),
  hash: z.string().optional(),
  recipient: z.string(),
  amount: z.string(),
  tokenSymbol: z.string().default("USDC"),
  gasless: z.boolean().default(true),
  batchOperations: z.any().optional(),
  errorMessage: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const insertTransactionSchema = z.object({
  userId: z.string(),
  type: z.enum(["transfer", "batch"]),
  recipient: z.string(),
  amount: z.string(),
  tokenSymbol: z.string().default("USDC"),
  batchOperations: z.any().optional(),
});

export const updateTransactionSchema = z
  .object({
    status: z.enum(["pending", "success", "failed"]).optional(),
    hash: z.string().optional(),
    errorMessage: z.string().optional(),
  })
  .partial();

// Update your googleAuthSchema in schema.js to handle optional tokens:

export const googleAuthSchema = z.object({
  access_token: z.string().optional(),
  id_token: z.string().optional(),
});

// You might also want to add wallet address validation:
export const walletUpdateSchema = z.object({
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format")
    .length(42, "Wallet address must be exactly 42 characters"),
});
