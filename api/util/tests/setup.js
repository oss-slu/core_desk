import prisma from "#prisma";
import { AccountType } from "@prisma/client";
import { beforeEach } from "vitest";

export let tc = {};

beforeEach(async () => {
  if (process.env.NODE_ENV === "test") {
    if (
      !process.env.DATABASE_URL.includes(
        "postgres://postgres:postgres@localhost"
      )
    ) {
      throw new Error("Cannot reset the database outside of localhost.");
    }

    // Disable triggers
    await prisma.$executeRawUnsafe("SET session_replication_role = 'replica';");

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

    // Re-enable triggers
    await prisma.$executeRawUnsafe("SET session_replication_role = 'origin';");

    // Create an initial user
    const globalUser = await prisma.user.create({
      data: {
        firstName: "TestFirstName",
        lastName: "TestLastName",
        email: "test@email.com",
      },
    });

    tc.globalUser = globalUser;

    const shop = await prisma.shop.create({
      data: {
        name: "TestShop",
        users: {
          create: {
            accountType: AccountType.CUSTOMER,
            userId: globalUser.id,
          },
        },
      },
    });

    tc.shop = shop;
  }
});
