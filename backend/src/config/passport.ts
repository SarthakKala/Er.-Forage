import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { env } from "./env";
import { upsertUser } from "../models/users";

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      // Must be an absolute URL and must match Google Cloud "Authorized redirect URIs" exactly.
      callbackURL: `${env.BACKEND_URL}/api/v1/auth/google/callback`
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: Profile,
      done: (error: Error | null, user?: Express.User | false) => void
    ) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("Google account does not expose an email"));
        }

        const user = await upsertUser({
          email,
          name: profile.displayName ?? email,
          avatarUrl: profile.photos?.[0]?.value
        });

        return done(null, user);
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);
