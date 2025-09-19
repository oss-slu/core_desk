const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.BASE_URL || "http://localhost:5173",
    specPattern: "cypress/e2e/**/*.cy.{js,ts,jsx,tsx}",
    supportFile: "cypress/support/e2e.js",
    video: true,
    screenshotsFolder: "cypress/screenshots",
    setupNodeEvents(on, config) {
      // Provide Prisma tasks from Node side (not in browser runtime)
      const { PrismaClient } = require("@prisma/client");
      const prisma = new PrismaClient();
      const path = require("path");
      const fs = require("fs");

      const resolveJwtSecret = () => {
        if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
        if (config?.env?.JWT_SECRET) return config.env.JWT_SECRET;
        try {
          const envPath = path.resolve(__dirname, "env", "api.env");
          if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, "utf8");
            const match = content
              .split(/\r?\n/)
              .map((l) => l.trim())
              .find((l) => l.startsWith("JWT_SECRET="));
            if (match) {
              // Handle optional quotes
              const raw = match.replace(/^JWT_SECRET=/, "").trim();
              return raw.replace(/^"|"$/g, "");
            }
          }
        } catch (_) {}
        // Fallback used by e2e docker env
        return "dev-e2e-secret";
      };

      on("task", {
        async "db:reset"() {
          // Disable triggers to allow cascading deletes where needed
          await prisma.$executeRawUnsafe(
            "SET session_replication_role = 'replica';"
          );
          // Explicitly clear tables in a safe order (preserve _prisma_migrations)
          await prisma.$transaction([
            prisma.logs.deleteMany(),
            prisma.userShop.deleteMany(),
            prisma.resourceImage.deleteMany(),
            prisma.materialImage.deleteMany(),
            prisma.additionalCostLineItem.deleteMany(),
            prisma.jobComment.deleteMany(),
            prisma.jobItem.deleteMany(),
            prisma.ledgerItem.deleteMany(),
            prisma.job.deleteMany(),
            prisma.userBillingGroup.deleteMany(),
            prisma.billingGroupInvitationLink.deleteMany(),
            prisma.billingGroup.deleteMany(),
            prisma.resource.deleteMany(),
            prisma.material.deleteMany(),
            prisma.resourceType.deleteMany(),
            prisma.shop.deleteMany(),
            prisma.user.deleteMany(),
          ]);
          await prisma.$executeRawUnsafe(
            "SET session_replication_role = 'origin';"
          );
          return null;
        },

        async "db:createUser"(data) {
          return prisma.user.create({ data });
        },

        async "db:getUserByEmail"(email) {
          return prisma.user.findUnique({ where: { email } });
        },

        async "db:findMany"(args) {
          const { model, where } = args || {};
          return prisma[model].findMany(where);
        },

        async "db:findAllUsers"() {
          return prisma.user.findMany();
        },

        /**
         * Generate a valid JWT for a given user.
         * Usage: cy.task('cy:authenticateUser', userId | { userId, expiresIn })
         * Returns: token (string)
         */
        async "cy:authenticateUser"(args) {
          const { userId, expiresIn } =
            typeof args === "string" ? { userId: args } : args || {};
          if (!userId) throw new Error("cy:authenticateUser requires userId");

          const user = await prisma.user.findUnique({ where: { id: userId } });
          if (!user) throw new Error(`User not found: ${userId}`);

          const secret = resolveJwtSecret();
          // Lazy-require jsonwebtoken (available via workspace deps)
          const jwt = require("jsonwebtoken");
          const token = jwt.sign(
            {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
            },
            secret,
            { expiresIn: expiresIn || "24h" }
          );
          return token;
        },

        log(message) {
          console.log(
            typeof message === "object"
              ? JSON.stringify(message, null, 2)
              : message
          );
          return null;
        },
      });

      on("after:run", async () => {
        await prisma.$disconnect();
      });

      return config;
    },
  },
});
