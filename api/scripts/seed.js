import { prisma } from "#prisma";

// From the process argv
const SHOP_NAME = process.argv[2];
const DEFAULT_USER_EMAIL = process.argv[3];

async function main() {
  if (!SHOP_NAME) {
    console.error("Please provide a shop name as the first argument.");
    process.exit(1);
    return;
  }
  if (!DEFAULT_USER_EMAIL) {
    console.error(
      "Please provide a default user email as the second argument."
    );
    process.exit(1);
    return;
  }

  // Seed the database with a default user
  const user = await prisma.user.findFirst({
    where: {
      email: DEFAULT_USER_EMAIL,
    },
  });

  if (!user) {
    console.error(
      `Default user is not in the database. Please log in first to create the user with the email of ${DEFAULT_USER_EMAIL} or pick a different user.`
    );
    const users = await prisma.user.findMany();
    console.log("Available users:", users.map((u) => u.email).join(", "));
    process.exit(1);
    return;
  }

  // Seed the database with a default shop
  const shop = await prisma.shop.create({
    data: {
      name: SHOP_NAME,
      color: "BLUE",
    },
  });

  if (!shop) {
    console.error(`Shop could not be created. Please try again.`);
    process.exit(1);
    return;
  }

  const userShop = await prisma.userShop.create({
    data: {
      userId: user.id,
      shopId: shop.id,
      accountType: "ADMIN",
      active: true,
    },
  });

  if (!userShop) {
    console.error(`User shop could not be created. Please try again.`);
    process.exit(1);
    return;
  }

  console.log(`Seeded database with a default user and shop.`);
}

main();
