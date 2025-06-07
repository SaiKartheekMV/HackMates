// app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

// Import middleware
const { apiLimiter } = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const profileRoutes = require("./routes/profiles");
const hackathonRoutes = require("./routes/hackathons");
const matchmakingRoutes = require("./routes/matchmaking");
const teamRoutes = require("./routes/teams");
const requestRoutes = require("./routes/requests");

// Create Express app
const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set("trust proxy", 1);

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "HackMates API",
      version: "1.0.0",
      description: "AI-powered hackathon teammate matching platform API",
      contact: {
        name: "HackMates Team",
        email: "support@hackmates.com",
      },
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === "production"
            ? "https://api.hackmates.com"
            : "http://localhost:5000",
        description:
          process.env.NODE_ENV === "production"
            ? "Production server"
            : "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/routes/*.js", "./src/models/*.js"], // Paths to files containing OpenAPI definitions
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        scriptSrc: ["'self'"],
        connectSrc: [
          "'self'",
          process.env.FRONTEND_URL || "http://localhost:3000",
        ],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:3001", // For testing
      "https://hackmates.vercel.app", // Production frontend
    ];

    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));

// Compression middleware
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return compression.filter(req, res);
    },
    threshold: 1024, // Only compress responses larger than 1KB
  })
);

// Logging middleware
if (process.env.NODE_ENV !== "test") {
  const logFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";
  app.use(
    morgan(logFormat, {
      skip: (req, res) => {
        // Skip logging for health checks and static files
        return req.url === "/health" || req.url.startsWith("/docs");
      },
    })
  );
}

// Body parsing middleware
app.use(
  express.json({
    limit: "10mb",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

// Static file serving
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"), {
    maxAge: process.env.NODE_ENV === "production" ? "1d" : 0,
    etag: true,
  })
);

// API Documentation
app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "HackMates API Documentation",
  })
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version || "1.0.0",
  });
});

// API status endpoint
app.get("/api/status", (req, res) => {
  res.json({
    api: "HackMates Backend",
    version: "1.0.0",
    status: "active",
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      profiles: "/api/profiles",
      hackathons: "/api/hackathons",
      matchmaking: "/api/matchmaking",
      teams: "/api/teams",
      requests: "/api/requests",
    },
  });
});

// API Routes
app.use("/api", apiLimiter);

// API Routes - ADD INDIVIDUAL DEBUGGING HERE TOO:
console.log("Setting up /api/auth...");
app.use("/api/auth", authRoutes);

console.log("Setting up /api/users...");
app.use("/api/users", userRoutes);

console.log("Setting up /api/profiles...");
app.use("/api/profiles", profileRoutes);

console.log("Setting up /api/hackathons...");
app.use("/api/hackathons", hackathonRoutes);
// In your main server file (app.js or server.js)
app.use('/api/hackathons', require('./routes/hackathons'));

console.log("Setting up /api/matchmaking...");
app.use("/api/matchmaking", matchmakingRoutes);

console.log("Setting up /api/teams...");
app.use("/api/teams", teamRoutes);

console.log("Setting up /api/requests...");
app.use("/api/requests", requestRoutes);

console.log("All routes set up successfully!");

// Admin routes (if needed in future)
app.use("/api/admin", (req, res, next) => {
  // Add admin authentication middleware here
  res.status(501).json({ message: "Admin routes not implemented yet" });
});

// Webhook endpoints for external services
app.post(
  "/webhooks/cloudinary",
  express.raw({ type: "application/json" }),
  (req, res) => {
    // Handle Cloudinary webhooks for file processing
    console.log("Received Cloudinary webhook:", req.body);
    res.status(200).json({ received: true });
  }
);

// FIXED: 404 handler for API routes - Use regex pattern instead of wildcard
app.use(/^\/api\/.*/, (req, res) => {
  res.status(404).json({
    error: "API endpoint not found",
    message: `The requested endpoint ${req.method} ${req.path} does not exist`,
    availableEndpoints: [
      "GET /api/status",
      "POST /api/auth/login",
      "POST /api/auth/register",
      "GET /api/profiles/me",
      "GET /api/hackathons",
      "GET /api/matchmaking/suggestions",
    ],
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to HackMates API! 🚀",
    documentation: "/docs",
    status: "/api/status",
    health: "/health",
    version: "1.0.0",
  });
});


// Catch-all handler for non-API routes
app.use(/.*/, (req, res) => {
  if (req.originalUrl.startsWith("/api/")) {
    res.status(404).json({
      error: "API endpoint not found",
      path: req.originalUrl,
    });
  } else {
    res.status(404).json({
      error: "Page not found",
      message:
        "This is an API server. Please use the appropriate API endpoints.",
      documentation: "/docs",
    });
  }
});

// Global error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown handling
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

console.log("=== DEBUGGING ALL ROUTE IMPORTS ===");
console.log(
  "authRoutes:",
  typeof authRoutes,
  "- Is function?",
  typeof authRoutes === "function"
);
console.log(
  "userRoutes:",
  typeof userRoutes,
  "- Is function?",
  typeof userRoutes === "function"
);
console.log(
  "profileRoutes:",
  typeof profileRoutes,
  "- Is function?",
  typeof profileRoutes === "function"
);
console.log(
  "hackathonRoutes:",
  typeof hackathonRoutes,
  "- Is function?",
  typeof hackathonRoutes === "function"
);
console.log(
  "matchmakingRoutes:",
  typeof matchmakingRoutes,
  "- Is function?",
  typeof matchmakingRoutes === "function"
);
console.log(
  "teamRoutes:",
  typeof teamRoutes,
  "- Is function?",
  typeof teamRoutes === "function"
);
console.log(
  "requestRoutes:",
  typeof requestRoutes,
  "- Is function?",
  typeof requestRoutes === "function"
);
console.log("=== END ROUTE DEBUG ===");

module.exports = app;