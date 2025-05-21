import { prisma } from "#prisma";

const USER_EMAIL = process.argv[2];

async function main() {
  if (!USER_EMAIL) {
    console.error("Please provide a user email as the first argument.");
    process.exit(1);
    return;
  }

  const user = await prisma.user.findFirst({
    where: {
      email: USER_EMAIL,
    },
  });

  if (!user) {
    console.error(`User with email ${USER_EMAIL} not found.`);
    const users = await prisma.user.findMany();
    console.log("Available users:", users.map((u) => u.email).join(", "));
    process.exit(1);
    return;
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      admin: true,
    },
  });
  console.log(`Made ${USER_EMAIL} an admin.`);
}

main();
