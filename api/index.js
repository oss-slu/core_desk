import express from "express";
import passport from "passport";
import { Strategy as SamlStrategy } from "passport-saml";
import bodyParser from "body-parser";
import samlConfig from "./config/saml-config.js";
import cors from "cors";
import jwt from "jsonwebtoken";
import { router } from "express-file-routing";
import dotenv from "dotenv";
import { prisma } from "./util/prisma.js";
import { LogType } from "@prisma/client";
dotenv.config();
import { createRouteHandler } from "uploadthing/express";
import { uploadRouter } from "./config/uploadthing.js";
import path from "path";
import { fileURLToPath } from "url";

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable CORS for your React app
app.use(
  cors({
    // origin: "http://localhost:3152", // Allow requests from your React app
    // optionsSuccessStatus: 200,
  })
);

// Initialize passport
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(passport.initialize());

// Log
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

// Passport SAML strategy
passport.use(
  new SamlStrategy(samlConfig, async (profile, done) => {
    try {
      const userEmail =
        profile.email ||
        profile[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
        ];

      // Check if the user exists in the database
      let user = await prisma.user.findUnique({
        where: { email: userEmail },
      });

      // If user doesn't exist, create a new user
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: userEmail,
            firstName: profile.firstName,
            lastName: profile.lastName,
          },
        });

        await prisma.logs.create({
          data: {
            userId: user.id,
            type: LogType.USER_CREATED,
          },
        });
      } else {
        await prisma.logs.create({
          data: {
            userId: user.id,
            type: LogType.USER_LOGIN,
          },
        });
      }

      // Pass the user to the next middleware
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

// SAML Assertion Consumer Service (ACS) Endpoint
app.post(
  "/assertion",
  passport.authenticate("saml", { failureRedirect: "/error", session: false }),
  (req, res) => {
    // Generate JWT
    const token = jwt.sign(
      {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
      },
      process.env.JWT_SECRET,
      { expiresIn: "3h" }
    );

    const relayState = req.body.RelayState;

    // Send token to the client
    res.redirect(
      (relayState ? relayState : process.env.BASE_URL) + "?token=" + token
    );
  }
);

app.use(express.json());

console.log("CALLBACK URL", process.env.SERVER_URL + "/api/files/callback");

app.use(
  "/api/files/upload",
  createRouteHandler({
    router: uploadRouter,
    config: {
      token: process.env.UPLOADTHING_TOKEN,
      callbackUrl: process.env.SERVER_URL + "/api/files/callback",
    },
  })
);

app.use("/api", await router());

app.use(express.static("../app/dist"));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../app/dist", "index.html"));
});

app.all("/log", (req, res) => {
  console.log(req.body, req.headers);
  res.send("ok");
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

// Error Route
app.get("/error", (req, res) => {
  res.send("Login Failed");
});

// Server Setup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
