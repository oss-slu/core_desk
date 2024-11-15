import { prisma } from "#prisma";

const main = async () => {
  const users = await prisma.user.findMany();
  console.log(users.length);
};

main();
