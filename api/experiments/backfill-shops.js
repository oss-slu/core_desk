// e2e/scripts/backfill-autojoin.js
// ES module, named exports, ready to run with: `node e2e/scripts/backfill-autojoin.js`

import { PrismaClient } from "#prisma-client";

const prisma = new PrismaClient();

/**
 * Backfill memberships so that every user is added to every shop
 * where `autoJoin` is true and the user isn't already a member.
 * New memberships default to AccountType.CUSTOMER.
 */
export const backfillAutoJoin = async () => {
  // 1) Load shops that should auto-join
  const shops = await prisma.shop.findMany({
    where: { autoJoin: true, active: true },
    select: { id: true },
  });

  if (shops.length === 0)
    return {
      created: 0,
      skippedExisting: 0,
      shopsConsidered: 0,
      usersConsidered: 0,
    };

  // 2) Load all users (ids only)
  const users = await prisma.user.findMany({
    select: { id: true },
  });

  if (users.length === 0)
    return {
      created: 0,
      skippedExisting: 0,
      shopsConsidered: shops.length,
      usersConsidered: 0,
    };

  // 3) Build a set of existing memberships to avoid dupes
  const existingMemberships = await prisma.userShop.findMany({
    where: {
      shopId: { in: shops.map((s) => s.id) },
      userId: { in: users.map((u) => u.id) },
    },
    select: { userId: true, shopId: true },
  });

  const existing = new Set(
    existingMemberships.map((m) => `${m.userId}::${m.shopId}`)
  );

  // 4) Prepare createMany payload (skip duplicates at DB level as a safety net)
  const rowsToCreate = [];
  for (const { id: shopId } of shops) {
    for (const { id: userId } of users) {
      const key = `${userId}::${shopId}`;
      if (!existing.has(key)) {
        rowsToCreate.push({
          userId,
          shopId,
          accountType: "CUSTOMER", // AccountType.CUSTOMER
          active: true,
          blacklisted: false,
        });
      }
    }
  }

  let created = 0;
  if (rowsToCreate.length > 0) {
    const res = await prisma.userShop.createMany({
      data: rowsToCreate,
      skipDuplicates: true,
    });
    created = res.count ?? 0;
  }

  const totalPairs = shops.length * users.length;
  const skippedExisting = totalPairs - rowsToCreate.length;

  return {
    created,
    skippedExisting,
    shopsConsidered: shops.length,
    usersConsidered: users.length,
  };
};

export const main = async () => {
  try {
    const result = await backfillAutoJoin();
    console.log(
      `Backfill complete: created=${result.created}, skippedExisting=${result.skippedExisting}, ` +
        `shops=${result.shopsConsidered}, users=${result.usersConsidered}`
    );
  } catch (err) {
    console.error("Backfill failed:", err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
};

// if (import.meta.url === `file://${process.argv[1]}`) {
//   // invoked directly
//   main();
// }
