require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const { connectRedis } = require("./config/redis");
const authRoutes = require("./routes/authRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const timetableRoutes = require("./routes/timetableRoutes");
const busRoutes = require("./routes/busRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const chatRoutes = require("./routes/chatRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const placementRoutes = require("./routes/placementRoutes");
const hostelRoutes = require("./routes/hostelRoutes");
const libraryRoutes = require("./routes/libraryRoutes");
const feeRoutes = require("./routes/feeRoutes");
const cafeteriaRoutes = require("./routes/cafeteriaRoutes");
const marketplaceRoutes = require("./routes/marketplaceRoutes");
const clubRoutes = require("./routes/clubRoutes");
const alumniRoutes = require("./routes/alumniRoutes");
const studentIdRoutes = require("./routes/studentIdRoutes");
const lostFoundRoutes = require("./routes/lostFoundRoutes");
const healthRoutes = require("./routes/healthRoutes");
const { initLeaderboardJob } = require("./jobs/leaderboardJob");
const { initQdrantSeed } = require("./jobs/qdrantSeedJob");
const errorHandler = require("./middleware/errorMiddleware");

// Initialize app
const app = express();
const server = http.createServer(app);

// Socket.io initialization
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Bind socket instance to express app
app.set("io", io);

// Security & Optimization Middlewares
app.use(helmet());
app.use(cors());
app.use(compression());

// Logger
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Request parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiter: Max 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    status: "error",
    message:
      "Too many requests from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

// Connections
connectDB();
connectRedis();

// Socket.IO event handler
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join", (roomName) => {
    socket.join(roomName);
    console.log(`Socket ${socket.id} joined room ${roomName}`);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/bus", busRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/placements", placementRoutes);
app.use("/api/hostels", hostelRoutes);
app.use("/api/library", libraryRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/cafeteria", cafeteriaRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/alumni", alumniRoutes);
app.use("/api/student-id", studentIdRoutes);
app.use("/api/lost-found", lostFoundRoutes);

// API health endpoint (Public status check)
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    message: "CampusOne Backend API is healthy",
    timestamp: new Date(),
  });
});

app.use("/api/health", healthRoutes);

// Root API info
app.get("/", (req, res) => {
  res.send("Welcome to the CampusOne API Server");
});

// Global Error Handler Middleware
app.use(errorHandler);

// Start Server
const PORT = process.env.NODE_ENV === "test" ? 0 : process.env.PORT || 5000;
server.listen(PORT, () => {
  if (process.env.NODE_ENV !== "test") {
    console.log(`Server running on port ${PORT}`);
    // Start background cron jobs
    initLeaderboardJob();
    // Seed FAQ vectors into Qdrant (idempotent)
    initQdrantSeed();
  }
});

module.exports = server;
