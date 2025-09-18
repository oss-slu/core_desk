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
