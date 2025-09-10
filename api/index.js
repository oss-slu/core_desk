import express from "express";
import passport from "passport";
import { Strategy as SamlStrategy } from "passport-saml";
import bodyParser from "body-parser";
import samlConfig from "./config/saml-config.js";
import cors from "cors";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { prisma } from "#prisma";
import { LogType } from "@prisma/client";
dotenv.config();
import path from "path";
import { fileURLToPath } from "url";
import registerRoutes from "./util/router.js";
import { createProxyMiddleware } from "http-proxy-middleware";
// import client from "#postmark";

// Define __dirname for ES modules
import { createUser } from "./util/createUser.js"; //import the createUser function
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
let server;

app.get("/digitalocean-health-check", (_, res) => res.send("OK"));

if (process.env.JACK == "true") {
  console.log("JACK SERVER, USING PROXY");
  app.use((req, res, next) => {
    console.log(req.url);
    next();
  });
  app.use(
    createProxyMiddleware({
      target: "https://open-project-5skum.ondigitalocean.app",
      changeOrigin: true,
      secure: false, // set false if the upstream has a self-signed cert
      logLevel: "warn",
    })
  );
} else {
  app.get("/digitalocean-health-check", (req, res) => {
    res.send("OK");
  });
  // Enable CORS for your React app
  app.use(
    cors({
      // origin: "http://localhost:3152", // Allow requests from your React app
      // optionsSuccessStatus: 200,
    })
  );

  //RESPONSE BODY LOGGER
  // app.use((req, res, next) => {
  //   const originalSend = res.send;

  //   res.send = function (body) {
  //     console.log("Response Body:", body); // Log the response body
  //     originalSend.call(this, body);
  //   };

  //   next();
  // });

  // Initialize passport
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(passport.initialize());

  // Log
  app.use((req, res, next) => {
    if (process.env.NODE_ENV !== "test") {
      console.log(req.method, req.url);
    }
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
        console.log(profile);
        let user = await prisma.user.findUnique({
          where: { email: userEmail },
        });
        user = createUser(profile);

        // If user doesn't exist, create a new user
        // if (!user) {
        //   user = await prisma.user.create({
        //     data: {
        //       email: userEmail,
        //       firstName: profile.firstName,
        //       lastName: profile.lastName,
        //     },
        //   });

        //   const shopsToJoin = await prisma.shop.findMany({
        //     where: {
        //       autoJoin: true,
        //     },
        //   });

        //   for (const shop of shopsToJoin) {
        //     await prisma.userShop.create({
        //       data: {
        //         userId: user.id,
        //         shopId: shop.id,
        //         active: true,
        //       },
        //     });

        //     await prisma.logs.create({
        //       data: {
        //         userId: user.id,
        //         type: LogType.USER_CONNECTED_TO_SHOP,
        //         shopId: shop.id,
        //       },
        //     });
        //   }

        //   await prisma.logs.create({
        //     data: {
        //       userId: user.id,
        //       type: LogType.USER_CREATED,
        //     },
        //   });
        // } else {
        //   await prisma.logs.create({
        //     data: {
        //       userId: user.id,
        //       type: LogType.USER_LOGIN,
        //     },
        //   });
        // }

        // Pass the user to the next middleware
        return done(null, user);
      } catch (error) {
        console.error(error);
        return done(error);
      }
    })
  );

  // SAML Assertion Consumer Service (ACS) Endpoint
  app.post(
    "/assertion",
    // This entire middleware below is only for SAML dev bypass (not using `yarn okta` but by sending a mock idp request.)
    (req, res, next) => {
      // Log incoming ACS payload basics (avoid logging full SAMLResponse)
      try {
        const hasSAML = Boolean(req.body?.SAMLResponse);
        const samlSize = hasSAML ? req.body.SAMLResponse?.length || 0 : 0;
        console.log(
          "[SAML][ACS] Hit. hasSAMLResponse:",
          hasSAML,
          "size:",
          samlSize
        );
        console.log(
          "[SAML][ACS] RelayState: ",
          req.body?.RelayState || "<none>"
        );
      } catch (e) {
        console.warn(
          "[SAML][ACS] Failed to log incoming body:",
          e?.message || e
        );
      }

      // Dev bypass: accept unsigned SAMLResponse generated by scripts/mock-idp.sh
      try {
        const allowUnsigned = process.env.SAML_ALLOW_UNSIGNED === "true";
        if (allowUnsigned && req.body?.SAMLResponse) {
          const xml = Buffer.from(req.body.SAMLResponse, "base64").toString(
            "utf8"
          );
          const hasSignature = /<\w*:Signature[\s>]/.test(xml);
          if (!hasSignature) {
            console.warn(
              "[SAML][ACS][DEV] Unsigned SAMLResponse detected; using dev bypass."
            );
            const extractAttr = (name) => {
              const re = new RegExp(
                `<\\w*:Attribute\\s+Name=\"${name.replace(
                  /[-/\\.^$*+?()|[\]{}]/g,
                  "\\$&"
                )}\"[\\s\\S]*?<\\w*:AttributeValue>([\\s\\S]*?)<\\/\\w*:AttributeValue>`,
                "i"
              );
              const m = xml.match(re);
              return m ? m[1].trim() : null;
            };
            const email =
              extractAttr(
                "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
              ) ||
              (() => {
                try {
                  const nameIdRe = new RegExp(
                    "<(?:\\w+:)?NameID[^>]*>([^<]+)</(?:\\w+:)?NameID>",
                    "i"
                  );
                  const m = xml.match(nameIdRe);
                  return m ? m[1].trim() : null;
                } catch (_) {
                  return null;
                }
              })();
            const firstName =
              extractAttr(
                "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"
              ) || "";
            const lastName =
              extractAttr(
                "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"
              ) || "";

            if (!email) {
              console.error(
                "[SAML][ACS][DEV] Could not extract email from unsigned SAML."
              );
              return res.redirect("/error");
            }

            (async () => {
              let user = await prisma.user.findUnique({ where: { email } });
              if (!user) {
                console.log(
                  "[SAML][ACS][DEV] Creating user:",
                  email,
                  firstName,
                  lastName
                );
                user = await createUser({ email, firstName, lastName });
              }

              const token = jwt.sign(
                {
                  id: user.id,
                  email: user.email,
                  firstName: user.firstName,
                  lastName: user.lastName,
                },
                process.env.JWT_SECRET,
                { expiresIn: "3h" }
              );

              const relayState = req.body.RelayState;
              const redirectTo =
                (relayState ? relayState : process.env.BASE_URL) +
                "?token=" +
                token;
              console.log("[SAML][ACS][DEV] Redirecting to:", redirectTo);
              return res.redirect(redirectTo);
            })().catch((e) => {
              console.error(
                "[SAML][ACS][DEV] Error generating token:",
                e?.message || e
              );
              return res.redirect("/error");
            });
            return; // stop chain
          }
        }
      } catch (e) {
        console.warn("[SAML][ACS][DEV] Bypass failed:", e?.message || e);
      }
      next();
    },
    passport.authenticate("saml", {
      failureRedirect: "/error",
      session: false,
    }),
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

      console.log("[SAML][ACS] Email notification mock.");

      /*

        client.sendEmail({
          "From": `${process.env.POSTMARK_FROM_EMAIL}`,
          "To": `${user.email}`,
          "Subject": "User Login detected for OpenSLU",
          "HtmlBody": `A login was detected at ${new Date(Date.now()).toLocaleString()} and ip TODO.` ,
          "TextBody": `A login was detected at ${new Date(Date.now()).toLocaleString()} and ip TODO.`,
          "MessageStream": "outbound"
        });

        */

      // Send token to the client
      const redirectTo =
        (relayState ? relayState : process.env.BASE_URL) +
        "?token" +
        "=" +
        token;

      res.redirect(redirectTo);
    }
  );

  app.use(express.json());

  app.use((req, res, next) => {
    // Hook into the response lifecycle
    const originalSend = res.send;

    res.send = async function (body) {
      if (res.statusCode === 403) {
        await prisma.logs.create({
          data: {
            type: LogType.FORBIDDEN_ACTION,
            userId: req.user?.id,
            message: JSON.stringify({
              message: res.body?.message,
              error: res.body?.error,
              method: req.method,
              url: req.originalUrl,
              body: req.body,
              query: req.query,
              ip: req.ip,
            }),
            shopId: req.params?.shopId,
            jobId: req.params?.jobId,
            jobItemId: req.params?.jobItemId,
            resourceId: req.params?.resourceId,
            resourceTypeId: req.params?.resourceTypeId,
            materialId: req.params?.materialId,
            commentId: req.params?.commentId,
            ledgerItemId: req.params?.ledgerItemId,
            billingGroupId: req.params?.billingGroupId,
            userBillingGroupId: req.params?.userBillingGroupId,
            billingGroupInvitationLinkId:
              req.params?.billingGroupInvitationLinkId,
          },
        });
      }

      // Call the original send method
      return originalSend.call(this, body);
    };

    next();
  });

  // app.use(
  //   "/api/files/upload",
  //   createRouteHandler({
  //     router: uploadRouter,
  //     config: {
  //       token: process.env.UPLOADTHING_TOKEN,
  //       callbackUrl: process.env.SERVER_URL + "/api/files/upload",
  //       logLevel: "Error",
  //     },
  //   })
  // );

  // app.use("/api", await router());

  // This route is used for training purposes only. It is not used in production.
  app.use((req, res, next) => {
    if (req.url.includes("joke/emoji")) {
      res.setHeader(
        "X-Punch-Line",
        "The cowboy lost his hat doing a cartwheel."
      );
    }
    next();
  });

  // Register all api routes
  await registerRoutes(app, path.join(process.cwd(), "routes"));

  app.get("/health", (req, res) => {
    res.send("OK");
  });

  app.use(express.static("../app/dist"));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../app/dist", "index.html"));
  });

  // Error Route
  app.get("/error", (req, res) => {
    res.send("Login Failed");
  });

  // Server Setup
}
const PORT = process.env.PORT || 3030;

if (process.env.NODE_ENV !== "test") {
  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export { app, server };
