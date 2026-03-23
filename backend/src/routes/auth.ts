import { Router } from "express";
import jwt from "jsonwebtoken";
import passport from "passport";
import { env } from "../config/env";
import { authMiddleware } from "../middleware/auth";

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

authRouter.post("/logout", (_req, res) => {
  return res.status(200).json({ message: "Logged out" });
});
