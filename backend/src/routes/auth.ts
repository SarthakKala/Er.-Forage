import { Router } from "express";
import jwt from "jsonwebtoken";
import passport from "passport";
import { env } from "../config/env";
import { authMiddleware } from "../middleware/auth";
import { deleteUserById } from "../models/users";

export const authRouter = Router();

authRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

authRouter.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${env.FRONTEND_URL}/login?error=oauth_failed` }),
  (req, res) => {
    if (!req.user) {
      return res.redirect(`${env.FRONTEND_URL}/login?error=user_not_found`);
    }

    const token = jwt.sign(
      { sub: req.user.id, email: req.user.email },
      env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const redirectUrl = `${env.FRONTEND_URL}/login?token=${encodeURIComponent(token)}`;
    return res.redirect(redirectUrl);
  }
);

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
