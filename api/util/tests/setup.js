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

    // Reset the database in a safe order to avoid foreign key constraint issues.
    await prisma.$transaction([
      // Delete records that do not depend on others first.
      prisma.logs.deleteMany(),
      prisma.userShop.deleteMany(),

      // Delete BillingGroup dependents first.
      prisma.billingGroupInvitationLink.deleteMany(),
      prisma.userBillingGroup.deleteMany(),
      prisma.billingGroup.deleteMany(),

      // Delete job-related dependents.
      prisma.additionalCostLineItem.deleteMany(),
      prisma.jobComment.deleteMany(),
      prisma.job.deleteMany(),

      // Delete other shop-related dependents.
      prisma.ledgerItem.deleteMany(),
      prisma.resourceImage.deleteMany(),
      prisma.resource.deleteMany(),
      prisma.resourceType.deleteMany(),
      prisma.materialImage.deleteMany(),
      prisma.material.deleteMany(),

      // Now it is safe to delete the shop.
      prisma.shop.deleteMany(),

      // Finally, delete users.
      prisma.user.deleteMany(),
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
    tc.user = globalUser;

    const targetUser = await prisma.user.create({
      data: {
        firstName: "TARGET_TestFirstName",
        lastName: "TARGET_TestLastName",
        email: "target_test@email.com",
      },
    });
    tc.targetUser = targetUser;

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
