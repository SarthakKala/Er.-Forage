import cookieParser from "cookie-parser";
import cors from "cors";
import cron from "node-cron";
import express from "express";
import helmet from "helmet";
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
import { skillsRouter } from "./routes/skills";
import { assignmentsRouter } from "./routes/assignments";
import { onboardingRouter } from "./routes/onboarding";
import { portfolioRouter } from "./routes/portfolio";
import { publicReportRouter } from "./routes/publicReport";
import { testAiRouter } from "./routes/testAi";
import { runWeeklySkillSnapshot } from "./jobs/snapshotSkills";
import { db } from "./lib/db";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = new Set<string>();
      if (env.FRONTEND_URL) allowed.add(env.FRONTEND_URL);
      if (env.NODE_ENV === "development") {
        for (const o of [
          "http://localhost:3000",
          "http://localhost:3001",
          "http://127.0.0.1:3000",
          "http://127.0.0.1:3001"
        ]) {
          allowed.add(o);
        }
      }
      if (!origin) return callback(null, true);
      return callback(null, allowed.has(origin));
    },
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
app.use("/api/v1/test-ai", testAiRouter);
app.use("/api/v1/public", publicReportRouter);

// Sprint 2 protected routes
app.use("/api/v1/connections", authMiddleware, connectionsRouter);
app.use("/api/v1/sync", authMiddleware, syncRouter);
app.use("/api/v1/submissions", authMiddleware, submissionsRouter);
app.use("/api/v1/skills", authMiddleware, skillsRouter);
app.use("/api/v1/assignments", authMiddleware, assignmentsRouter);
app.use("/api/v1/onboarding", authMiddleware, onboardingRouter);
app.use("/api/v1/portfolio", authMiddleware, portfolioRouter);

// Protect remaining /api/v1 routes.
app.use("/api/v1", authMiddleware, protectedRouter);

app.use(errorMiddleware);

cron.schedule("0 0 * * 0", () => {
  runWeeklySkillSnapshot().catch((err) =>
    console.error("[cron] Weekly skill snapshot failed:", err)
  );
});

app.listen(env.PORT, async () => {
  try {
    await db.query("SELECT 1");
    console.log(`Backend running at http://localhost:${env.PORT}`);
    console.log(
      `OPENROUTER_API_KEY loaded: ${Boolean(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim())}`
    );
  } catch (error) {
    console.error("Database connection check failed:", error);
  }
});
