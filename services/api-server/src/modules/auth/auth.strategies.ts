import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Express } from "express";
import session from "express-session";
import { sessionStore } from "../../core/database/sessionStore";
import { User as SelectUser } from "@edusphere/types";
import { authRepository } from "./auth.repository";
import { authService } from "./auth.service";

declare global {
  namespace Express {
    interface User extends SelectUser { }
  }
}

export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "edusphere_secret",
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
});

export function setupAuth(app: Express) {
  app.use(sessionMiddleware);

  app.use(passport.initialize());
  app.use(passport.session());

  // ===== Local Strategy =====
  passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      try {
        const user = await authRepository.getUserByEmail(email);
        const match = user && user.password && (await authService.comparePasswords(password, user.password));
        if (!user || !match) {
          return done(null, false, { message: "Invalid email or password" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  // ===== Google OAuth Strategy =====
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/api/auth/google/callback",
          scope: ["profile", "email"],
        },
        async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
          try {
            const email = profile.emails?.[0]?.value || "";
            const name = profile.displayName || profile.name?.givenName || "Google User";
            const avatarUrl = profile.photos?.[0]?.value;
            const user = await authService.findOrCreateOAuthUser("google", profile.id, email, name, avatarUrl);
            done(null, user);
          } catch (err) {
            done(err);
          }
        }
      )
    );
  }

  // ===== GitHub OAuth Strategy =====
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          callbackURL: "/api/auth/github/callback",
          scope: ["user:email"],
        },
        async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
          try {
            const email = profile.emails?.[0]?.value || "";
            const name = profile.displayName || profile.username || "GitHub User";
            const avatarUrl = profile.photos?.[0]?.value;
            const user = await authService.findOrCreateOAuthUser("github", profile.id, email, name, avatarUrl);
            done(null, user);
          } catch (err) {
            done(err);
          }
        }
      )
    );
  }

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await authRepository.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
}
