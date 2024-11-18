import prisma from "#prisma";
import { beforeEach } from "vitest";

beforeEach(async () => {
  // Reset the database before each test.
  // First, make sure the database is NOT production
  // if (process.env.NODE_ENV === "production") {
  //   throw new Error("Cannot reset the database in production.");
  // }
  if (process.env.NODE_ENV === "test") {
    if (
      !process.env.DATABASE_URL.includes(
        "postgres://postgres:postgres@localhost"
      )
    ) {
      throw new Error("Cannot reset the database outside of localhost.");
    }

    // Reset the database
    await prisma.$transaction([
      prisma.user.deleteMany(),
      prisma.logs.deleteMany(),
      prisma.userShop.deleteMany(),
      prisma.shop.deleteMany(),
      prisma.resource.deleteMany(),
      prisma.material.deleteMany(),
      prisma.materialImage.deleteMany(),
      prisma.resourceImage.deleteMany(),
      prisma.resourceType.deleteMany(),
      prisma.job.deleteMany(),
      prisma.ledgerItem.deleteMany(),
      prisma.jobComment.deleteMany(),
      prisma.additionalCostLineItem.deleteMany(),
      prisma.jobItem.deleteMany(),
      prisma.billingGroup.deleteMany(),
      prisma.billingGroupInvitationLink.deleteMany(),
      prisma.userBillingGroup.deleteMany(),
    ]);

    // Create an initial user
    await prisma.user.create({
      data: {
        firstName: "TestFirstName",
        lastName: "TestLastName",
        email: "test@email.com",
      },
    });
  }
});
