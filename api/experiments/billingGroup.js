import { prisma } from "#prisma";

console.log(
  (
    await prisma.billingGroup.findFirst({
      where: {
        id: "cm6twwjc1000511xe5pb747hn",
      },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    })
  ).users
);
