import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import passport from "passport";
import { env } from "./config/env";
import "./config/passport";
import { errorMiddleware } from "./middleware/error";
import { authMiddleware } from "./middleware/auth";
import { authRouter } from "./routes/auth";
import { protectedRouter } from "./routes/protected";
import { connectionsRouter } from "./routes/connections";
import { syncRouter } from "./routes/sync";
import { submissionsRouter } from "./routes/submissions";
import { db } from "./lib/db";

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// /api/v1/auth/* stays public for OAuth and login bootstrap.
app.use("/api/v1/auth", authRouter);

// Sprint 2 protected routes
app.use("/api/v1/connections", authMiddleware, connectionsRouter);
app.use("/api/v1/sync", authMiddleware, syncRouter);
app.use("/api/v1/submissions", authMiddleware, submissionsRouter);

// Protect remaining /api/v1 routes.
app.use("/api/v1", authMiddleware, protectedRouter);

app.use(errorMiddleware);

app.listen(env.PORT, async () => {
  try {
    await db.query("SELECT 1");
    console.log(`Backend running at http://localhost:${env.PORT}`);
  } catch (error) {
    console.error("Database connection check failed:", error);
  }
});
