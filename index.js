import express from "express";
import passport from "passport";
import { Strategy as SamlStrategy } from "passport-saml";
import bodyParser from "body-parser";
import session from "express-session";
import samlConfig from "./saml-config.js";
import cors from "cors";
import jwt from "jsonwebtoken";

const app = express();

// Enable CORS
app.use(cors());

// Configure session middleware
app.use(
  session({
    secret: "your-secret-key", // Replace with a secure key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set `secure: true` in production with HTTPS
  })
);

// Initialize passport and sessions
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.session()); // Add this for session support

// Passport SAML strategy
passport.use(
  new SamlStrategy(samlConfig, (profile, done) => {
    const user = {
      id: profile.nameID,
      email:
        profile.email ||
        profile[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
        ],
      firstName: profile.firstName,
      lastName: profile.lastName,
    };
    return done(null, user);
  })
);

// Serialize and deserialize user (required for sessions)
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// SAML Login Route
app.get("/login", (req, res) => {
  res.json({ message: "Login route", url: samlConfig.login });
});

// SAML Assertion Consumer Service (ACS) Endpoint
app.post(
  "/assertion",
  passport.authenticate("saml", { failureRedirect: "/error" }),
  (req, res) => {
    res.send(`Hello, ${req.user.firstName}!`);
  }
);

// Logout Route
app.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

// Error Route
app.get("/error", (req, res) => {
  res.send("Login Failed");
});

// Display user info
app.get("/", (req, res) => {
  res.send(`Hello, ${req.user ? JSON.stringify(req.user) : "Guest"}!`);
});

// Server Setup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
