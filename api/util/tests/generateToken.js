import { prisma } from "#prisma";
import jwt from "jsonwebtoken";

export const gt = async (options) => {
  const ga = options?.ga || false;
  const suspended = options?.suspended || false;
  let user = await prisma.user.findFirst({
    where: {
      email: "test@email.com",
    },
  });

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

  if (!user) {
    throw new Error(
      "User not found. Are tests running properly? Check /api/util/tests/setup.js"
    );
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
