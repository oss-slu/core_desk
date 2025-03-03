import { prisma } from "#prisma";
import jwt from "jsonwebtoken";

export const gt = async (options) => {
  const ga = options?.ga || false; // Global Admin
  const suspended = options?.suspended || false;
  const sat = options?.sat || null; // Shop Account Type

  let user =
    options?.user ||
    (await prisma.user.findFirst({
      where: {
        email: "test@email.com",
      },
    }));

  if (ga) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        admin: true,
      },
    });
  }

  if (suspended) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        suspended: true,
      },
    });
  }

  if (sat) {
    // Shop accountType
    await prisma.userShop.updateMany({
      where: { userId: user.id },
      data: {
        accountType: sat,
      },
    });
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

  return ["Authorization", "Bearer " + token];
};
