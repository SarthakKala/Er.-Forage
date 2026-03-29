import { Router } from "express";
import jwt from "jsonwebtoken";
import passport from "passport";
import { env } from "../config/env";
import { authMiddleware } from "../middleware/auth";
import { deleteUserById } from "../models/users";
import type { User } from "../models/users";

export const authRouter = Router();

function safeOAuthRedirectPath(raw: unknown): string {
  if (typeof raw !== "string" || raw.length === 0) return "";
  const p = raw.trim();
  if (!p.startsWith("/") || p.startsWith("//")) return "";
  if (p.includes("..") || p.includes("\\")) return "";
  if (p.length > 512) return "";
  return p;
}

authRouter.get("/google", (req, res, next) => {
  const redirectAfter = safeOAuthRedirectPath(req.query.redirect);
  const opts: {
    scope: string[];
    session: boolean;
    state?: string;
  } = {
    scope: ["profile", "email"],
    session: false
  };
  if (redirectAfter) {
    opts.state = Buffer.from(redirectAfter, "utf8").toString("base64url");
  }
  passport.authenticate("google", opts)(req, res, next);
});

authRouter.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, (err: Error | null, user: User | false | undefined) => {
    if (err) {
      console.error("[oauth] Google callback error:", err.message);
      return res.redirect(`${env.FRONTEND_URL}/login?error=oauth_failed`);
    }
    if (!user) {
      return res.redirect(`${env.FRONTEND_URL}/login?error=user_not_found`);
    }
    let redirectPath = "";
    try {
      const st = req.query.state;
      if (typeof st === "string" && st.length > 0) {
        redirectPath = Buffer.from(st, "base64url").toString("utf8");
        redirectPath = safeOAuthRedirectPath(redirectPath);
      }
    } catch {
      redirectPath = "";
    }
    try {
      const token = jwt.sign({ sub: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: "7d" });
      const params = new URLSearchParams({ token });
      if (redirectPath) params.set("redirect", redirectPath);
      return res.redirect(`${env.FRONTEND_URL}/login?${params.toString()}`);
    } catch (e) {
      console.error("[oauth] JWT sign failed:", e);
      return res.redirect(`${env.FRONTEND_URL}/login?error=oauth_failed`);
    }
  })(req, res, next);
});

authRouter.get("/me", authMiddleware, (req, res) => {
  return res.json({ user: req.user });
});

authRouter.delete("/me", authMiddleware, async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const ok = await deleteUserById(req.user.id);
    if (!ok) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return next(e);
  }
});

authRouter.post("/logout", (_req, res) => {
  return res.status(200).json({ message: "Logged out" });
});
