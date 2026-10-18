import express from "express";
import cors from "cors";
import helmet from "helmet";
import { pool } from "./config/db";
import apiRouters from "./routes";
import notFound from "./middleware/not-found";
import errorHandler from "./middleware/error-handler";

const app = express();

// Security headers
app.use(helmet());

// Allow requests from the frontend
app.use(cors());

// Parse JSON request bodies
app.use(express.json());


// Database health check
app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");

    res.status(200).json({
      success: true,
      message: "API and database are working",
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    res.status(503).json({
      success: false,
      message: "Database connection is unavailable",
    });
  }
});


// Main API router
app.use('/api',apiRouters)

// Handle requests that match no registered route
app.use(notFound);

// Handle errors forwarded by routes and middleware
app.use(errorHandler);

export default app;
