import { storage } from "./storage.js";
import {
  insertUserSchema,
  insertTransactionSchema,
  updateTransactionSchema,
  googleAuthSchema,
  walletUpdateSchema,
} from "./schema.js";

export async function registerRoutes(app) {
  // Google OAuth login/register
  app.post("/api/auth/google", async (req, res) => {
    try {
      console.log("Google auth request received:", {
        hasAccessToken: !!req.body.access_token,
        hasIdToken: !!req.body.id_token,
        origin: req.headers.origin,
      });

      // Parse and validate request body
      let parsedBody;
      try {
        // Handle both required and optional tokens
        const flexibleSchema = googleAuthSchema
          .partial()
          .refine((data) => data.access_token || data.id_token, {
            message: "Either access_token or id_token must be provided",
          });
        parsedBody = flexibleSchema.parse(req.body);
      } catch (validationError) {
        console.error("Request validation failed:", validationError);
        return res.status(400).json({
          message:
            "Invalid request data. Please check your authentication tokens.",
          error: "VALIDATION_ERROR",
          details: validationError.errors,
        });
      }

      const { access_token, id_token } = parsedBody;

      let googleUser;

      // Try access token first (more reliable)
      if (access_token) {
        try {
          console.log("Verifying access token with Google...");
          const response = await fetch(
            `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${access_token}`
          );

          if (response.ok) {
            googleUser = await response.json();
            console.log("Google user verified via access token:", {
              email: googleUser.email,
              id: googleUser.id,
            });
          } else {
            const errorData = await response.text();
            console.error("Google API error:", response.status, errorData);

            if (response.status === 401) {
              return res.status(401).json({
                message:
                  "Invalid or expired Google token. Please try signing in again.",
                error: "INVALID_ACCESS_TOKEN",
              });
            } else if (response.status === 403) {
              return res.status(403).json({
                message:
                  "Access denied by Google. Please check your account permissions.",
                error: "ACCESS_DENIED",
              });
            } else {
              return res.status(response.status).json({
                message: `Google authentication service error: ${errorData}`,
                error: "GOOGLE_API_ERROR",
              });
            }
          }
        } catch (fetchError) {
          console.error("Error fetching from Google API:", fetchError);
          return res.status(503).json({
            message:
              "Unable to verify credentials with Google. Please try again.",
            error: "GOOGLE_SERVICE_ERROR",
          });
        }
      }

      // If access token failed or not provided, try ID token
      if (!googleUser && id_token) {
        try {
          console.log("Verifying ID token...");
          // Decode JWT token (basic validation)
          const tokenParts = id_token.split(".");
          if (tokenParts.length !== 3) {
            return res.status(400).json({
              message: "Invalid ID token format.",
              error: "INVALID_ID_TOKEN_FORMAT",
            });
          }

          const payload = JSON.parse(atob(tokenParts[1]));

          // Basic validation
          if (!payload.sub || !payload.email) {
            return res.status(400).json({
              message:
                "Invalid ID token payload. Missing required user information.",
              error: "INVALID_ID_TOKEN_PAYLOAD",
            });
          }

          // Convert to Google user format
          googleUser = {
            id: payload.sub,
            email: payload.email,
            name: payload.name || payload.given_name || "Unknown User",
            picture: payload.picture || "",
            verified_email: payload.email_verified || false,
          };

          console.log("Google user verified via ID token:", {
            email: googleUser.email,
            id: googleUser.id,
          });
        } catch (tokenError) {
          console.error("Error decoding ID token:", tokenError);
          return res.status(400).json({
            message: "Invalid ID token. Please try signing in again.",
            error: "INVALID_ID_TOKEN",
          });
        }
      }

      // If we still don't have a Google user, authentication failed
      if (!googleUser) {
        return res.status(401).json({
          message:
            "Could not authenticate with Google. Please provide valid tokens.",
          error: "AUTHENTICATION_FAILED",
        });
      }

      // Validate required Google user data
      if (!googleUser.id || !googleUser.email) {
        return res.status(400).json({
          message: "Incomplete user information from Google.",
          error: "INCOMPLETE_USER_DATA",
        });
      }

      // Check if user exists in database
      let user;
      try {
        user = await storage.getUserByGoogleId(googleUser.id);
        console.log("Existing user found:", !!user);
      } catch (dbError) {
        console.error(
          "Database error when checking for existing user:",
          dbError
        );
        return res.status(500).json({
          message: "Database error occurred. Please try again later.",
          error: "DATABASE_ERROR",
        });
      }

      if (!user) {
        // Create new user
        try {
          console.log("Creating new user...");
          const newUser = insertUserSchema.parse({
            email: googleUser.email,
            googleId: googleUser.id,
            name: googleUser.name || googleUser.email.split("@")[0], // Fallback name
            walletAddress: undefined, // Will be set later when wallet is created
          });

          user = await storage.createUser(newUser);
          console.log("New user created:", user.id);
        } catch (createError) {
          console.error("Error creating new user:", createError);

          if (createError.name === "ZodError") {
            return res.status(400).json({
              message: "Invalid user data from Google.",
              error: "USER_VALIDATION_ERROR",
              details: createError.errors,
            });
          }

          return res.status(500).json({
            message: "Failed to create user account. Please try again.",
            error: "USER_CREATION_ERROR",
          });
        }
      } else {
        // Update existing user with latest info from Google if needed
        try {
          console.log("User already exists, using existing data:", user.id);
          // Note: In your MemStorage, you might want to add an updateUser method
          // For now, we'll just use the existing user data
        } catch (updateError) {
          console.warn(
            "Note: Could not update existing user data:",
            updateError
          );
          // Don't fail the request, just log and continue
        }
      }

      // Store user in session
      req.session.userId = user.id;
      req.session.user = user;

      // Return success response
      res.json({
        message: "Authentication successful",
        ...user, // Return the full user object as your frontend expects
      });
    } catch (error) {
      console.error("Unexpected error in Google auth:", error);

      // Handle different types of errors
      if (error.name === "ZodError") {
        return res.status(400).json({
          message:
            "Invalid request data. Please check your authentication tokens.",
          error: "VALIDATION_ERROR",
          details: error.errors,
        });
      }

      // Generic error fallback
      res.status(500).json({
        message:
          "Authentication service temporarily unavailable. Please try again later.",
        error: "INTERNAL_ERROR",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });

  // Session validation endpoint
  app.get("/api/auth/validate", (req, res) => {
    if (!req.session.userId || !req.session.user) {
      return res.status(401).json({
        message: "No valid session found",
        error: "NOT_AUTHENTICATED",
      });
    }

    res.json({
      valid: true,
      user: req.session.user,
    });
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
        return res.status(500).json({
          message: "Failed to logout properly",
          error: "LOGOUT_ERROR",
        });
      }

      res.clearCookie("connect.sid"); // Clear session cookie
      res.json({
        message: "Logged out successfully",
      });
    });
  });

  // Get current user (useful for frontend)
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      // Get fresh user data from storage
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({
          message: "User not found",
          error: "USER_NOT_FOUND",
        });
      }

      res.json(user);
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({
        message: "Failed to get user data",
        error: "FETCH_ERROR",
      });
    }
  });

  // Update user wallet address
  app.patch("/api/users/:id/wallet", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      // Check if user can update this wallet
      if (req.session.user.id !== id) {
        return res.status(403).json({
          message: "You can only update your own wallet",
          error: "ACCESS_DENIED",
        });
      }

      const { walletAddress } = walletUpdateSchema.parse(req.body);

      const user = await storage.updateUserWallet(id, walletAddress);
      if (!user) {
        return res.status(404).json({
          message: "User not found",
          error: "USER_NOT_FOUND",
        });
      }

      // Update session
      req.session.user = user;

      res.json(user);
    } catch (error) {
      console.error("Wallet update error:", error);

      if (error.name === "ZodError") {
        return res.status(400).json({
          message: "Invalid wallet address format",
          error: "VALIDATION_ERROR",
          details: error.errors,
        });
      }

      res.status(500).json({
        message: "Failed to update wallet",
        error: "UPDATE_ERROR",
      });
    }
  });

  // Get user transactions
  app.get("/api/users/:id/transactions", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      // Check if user can access these transactions
      if (req.session.user.id !== id) {
        return res.status(403).json({
          message: "You can only access your own transactions",
          error: "ACCESS_DENIED",
        });
      }

      const transactions = await storage.getTransactionsByUserId(id);
      res.json(transactions);
    } catch (error) {
      console.error("Get transactions error:", error);
      res.status(500).json({
        message: "Failed to get transactions",
        error: "FETCH_ERROR",
      });
    }
  });

  // Create transaction
  app.post("/api/transactions", requireAuth, async (req, res) => {
    try {
      const transactionData = insertTransactionSchema.parse({
        ...req.body,
        userId: req.session.user.id, // Ensure transaction belongs to authenticated user
      });

      const transaction = await storage.createTransaction(transactionData);
      res.json(transaction);
    } catch (error) {
      console.error("Create transaction error:", error);

      if (error.name === "ZodError") {
        return res.status(400).json({
          message: "Invalid transaction data",
          error: "VALIDATION_ERROR",
          details: error.errors,
        });
      }

      res.status(500).json({
        message: "Failed to create transaction",
        error: "CREATION_ERROR",
      });
    }
  });

  // Update transaction status
  app.patch("/api/transactions/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      // Check if transaction belongs to user
      const existingTransaction = await storage.getTransaction(id);
      if (!existingTransaction) {
        return res.status(404).json({
          message: "Transaction not found",
          error: "TRANSACTION_NOT_FOUND",
        });
      }

      if (existingTransaction.userId !== req.session.user.id) {
        return res.status(403).json({
          message: "You can only update your own transactions",
          error: "ACCESS_DENIED",
        });
      }

      const updates = updateTransactionSchema.parse(req.body);
      const transaction = await storage.updateTransaction(id, updates);

      res.json(transaction);
    } catch (error) {
      console.error("Update transaction error:", error);

      if (error.name === "ZodError") {
        return res.status(400).json({
          message: "Invalid update data",
          error: "VALIDATION_ERROR",
          details: error.errors,
        });
      }

      res.status(500).json({
        message: "Failed to update transaction",
        error: "UPDATE_ERROR",
      });
    }
  });

  // Get single transaction
  app.get("/api/transactions/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      const transaction = await storage.getTransaction(id);
      if (!transaction) {
        return res.status(404).json({
          message: "Transaction not found",
          error: "TRANSACTION_NOT_FOUND",
        });
      }

      // Check if transaction belongs to user
      if (transaction.userId !== req.session.user.id) {
        return res.status(403).json({
          message: "You can only access your own transactions",
          error: "ACCESS_DENIED",
        });
      }

      res.json(transaction);
    } catch (error) {
      console.error("Get transaction error:", error);
      res.status(500).json({
        message: "Failed to get transaction",
        error: "FETCH_ERROR",
      });
    }
  });

  return app;
}

// Middleware to require authentication
function requireAuth(req, res, next) {
  if (!req.session.userId || !req.session.user) {
    return res.status(401).json({
      message: "Authentication required. Please log in.",
      error: "AUTHENTICATION_REQUIRED",
    });
  }
  next();
}
