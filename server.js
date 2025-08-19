import express from "express";
import cors from "cors";
import session from "express-session";
import MemoryStore from "memorystore";
import { registerRoutes } from "./routes.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Session store
const MemoryStoreSession = MemoryStore(session);

// CORS configuration for Google Auth
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests from your frontend origins
    const allowedOrigins = [
      "http://localhost:5173", // Vite dev server (your current setup)
      "http://localhost:3000", // React dev server alternative
      "http://localhost:8080", // Alternative dev port
      "https://yourdomain.com", // Production domain (replace with actual)
    ];

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Essential for cookies/auth
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
  ],
  exposedHeaders: ["Content-Length", "X-Foo", "X-Bar"],
  maxAge: 86400, // 24 hours - cache preflight responses
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options("*", cors(corsOptions));

// Additional security headers for Google OAuth
app.use((req, res, next) => {
  // Allow popups for Google OAuth
  res.header("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.header("Cross-Origin-Embedder-Policy", "unsafe-none");

  // Referrer policy for better security
  res.header("Referrer-Policy", "strict-origin-when-cross-origin");

  next();
});

// Body parser middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Session configuration
app.use(
  session({
    cookie: {
      maxAge: 86400000, // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Auto-set based on environment
      sameSite: "lax",
    },
    store: new MemoryStoreSession({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    secret: process.env.SESSION_SECRET || "your-secret-key-here",
    resave: false,
    saveUninitialized: false,
  })
);

// Request logging middleware (helpful for debugging)
app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${
      req.headers.origin || "none"
    }`
  );
  next();
});

// Register API routes
await registerRoutes(app);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    cors: {
      allowedOrigins: corsOptions.origin.toString().includes("function")
        ? "Dynamic"
        : corsOptions.origin,
    },
  });
});

// Error handling middleware for CORS
app.use((error, req, res, next) => {
  console.error("Server error:", error);

  if (error.message === "Not allowed by CORS") {
    return res.status(403).json({
      error: "CORS_ERROR",
      message: "Cross-origin request not allowed",
      details: `Origin '${req.headers.origin}' is not authorized to access this API`,
      allowedOrigins: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
      ],
    });
  }

  res.status(500).json({
    error: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "NOT_FOUND",
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`CORS enabled for: http://localhost:5173, http://localhost:3000`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
