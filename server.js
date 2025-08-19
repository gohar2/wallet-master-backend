// server.js - Fixed CORS and session configuration
import express from "express";
import cors from "cors";
import session from "express-session";
import MemoryStore from "memorystore";
import { registerRoutes } from "./routes.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Session store
const MemoryStoreSession = MemoryStore(session);

// CORS configuration - Fixed for both localhost and 127.0.0.1
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:5173",
      "http://127.0.0.1:5173", // Fixed: ensure this is included
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001",
      "https://yourdomain.com",
    ];

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      console.log(`✅ CORS allowed for origin: ${origin}`);
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked origin: ${origin}`);
      console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);
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
  optionsSuccessStatus: 200,
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options("*", cors(corsOptions));

// Additional security headers
app.use((req, res, next) => {
  res.header("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.header("Cross-Origin-Embedder-Policy", "unsafe-none");
  res.header("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Body parser middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Session configuration - Fixed for both localhost and 127.0.0.1
app.use(
  session({
    cookie: {
      maxAge: 86400000, // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // More permissive in dev
      domain: process.env.NODE_ENV === "production" ? undefined : undefined, // Don't set domain in dev
    },
    store: new MemoryStoreSession({
      checkPeriod: 86400000,
    }),
    secret: process.env.SESSION_SECRET || "your-secret-key-here",
    resave: false,
    saveUninitialized: false,
    name: "sessionId", // Custom session name
  })
);

// Enhanced request logging middleware
app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${
      req.headers.origin || "none"
    } - Session: ${req.session?.userId ? "✅" : "❌"}`
  );
  next();
});

// Register API routes
await registerRoutes(app);

// Enhanced health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    cors: {
      allowedOrigins: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ],
    },
    session: {
      configured: true,
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    },
  });
});

// Enhanced error handling middleware
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
        "http://127.0.0.1:3000",
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
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 CORS enabled for:`);
  console.log(`   - http://localhost:5173`);
  console.log(`   - http://127.0.0.1:5173`);
  console.log(`   - http://localhost:3000`);
  console.log(`   - http://127.0.0.1:3000`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || "development"}`);
});
