import prisma from "#prisma";
import { LogType } from "@prisma/client";

export const createUser = async ({ firstName, lastName, email },
  logging = false
) => {
  const user = await prisma.user.create({
    data: {
      email: email,
      firstName: firstName,
      lastName: lastName,
    },
  });

  if (logging) {
    console.log(
      `Created user ${user.firstName} ${user.lastName} (${user.id}).`
    );
  }

  const shopsToJoin = await prisma.shop.findMany({
    where: {
      autoJoin: true,
    },
  });

    await prisma.user.update({
              where: {
                id: user.id,
              },
              data:{
                admin: true,
              },
    });
            console.log(`User ${user}, set as admin`);
            
    await prisma.logs.create({
              data: {
                type: LogType.USER_PROMOTED_TO_ADMIN,
                userId: user.id,
                message: "First user, promoted to admin",
              }
        });
  

  for (const shop of shopsToJoin) {
    await prisma.userShop.create({
      data: {
        userId: user.id,
        shopId: shop.id,
        active: true,
      },
    });

    await prisma.logs.create({
      data: {
        userId: user.id,
        type: LogType.USER_CONNECTED_TO_SHOP,
        shopId: shop.id,
      },
    });

    console.log(
      `Joined shop ${shop.name} (${shop.id}) for user ${user.firstName} ${user.lastName} (${user.id}).`
    );
  }

  await prisma.logs.create({
    data: {
      userId: user.id,
      type: LogType.USER_CREATED,
    },
  });

  return user;
};
