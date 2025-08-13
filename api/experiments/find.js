import { prisma } from "#prisma";

const data = await prisma.job.findMany({
  where: { shopId: "cm2dz5xdz0002665mvd5j491p", user: {} },
  include: {
    _count: { select: { items: { where: { active: true } } } },
    items: {
      where: { active: true },
      include: { material: true, resource: true },
    },
    user: { select: { firstName: true, lastName: true, id: true } },
    additionalCosts: { include: { material: true, resource: true } },
  },
  // take: 20,
  skip: 0,
});

console.log(data);
console.log(data.length);
