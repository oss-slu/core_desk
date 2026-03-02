import { LogType } from "#prisma-client";
import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";

async function hasConflict(resourceId, startTime, endTime, excludeId = null) {
  const conflicts = await prisma.appointment.findMany({
    where: {
      resourceId,
      id: excludeId ? { not: excludeId } : undefined,
      AND: [
        { startTime: { lt: new Date(endTime) } },
        { endTime: { gt: new Date(startTime) } },
      ],
    },
  });
  return conflicts.length > 0;
}

export const get = [
  verifyAuth,
  async (req, res) => {
    try {
      const { shopId } = req.params;
      const userId = req.user.id;

      const userShop = await prisma.userShop.findFirst({
        where: { userId, shopId, active: true },
      });
      if (!userShop) return res.status(403).json({ error: "Unauthorized" });

      const isAdminOrOperator =
        req.user.admin || ["ADMIN", "OPERATOR"].includes(userShop.accountType);

      const appointments = await prisma.appointment.findMany({
        where: {
          shopId,
          userId: isAdminOrOperator ? undefined : userId,
        },
        include: {
          resource: true,
          user: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { startTime: "asc" },
      });

      res.json({ appointments });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "An error occurred" });
    }
  },
];

export const post = [
  verifyAuth,
  async (req, res) => {
    try {
      const { shopId } = req.params;
      const userId = req.user.id;
      const { resourceId, startTime, endTime } = req.body;

      const userShop = await prisma.userShop.findFirst({
        where: { userId, shopId, active: true },
      });
      if (!userShop) return res.status(403).json({ error: "Unauthorized" });

      const resource = await prisma.resource.findFirst({
        where: { id: resourceId, shopId, active: true },
      });
      if (!resource) return res.status(404).json({ error: "Resource not found" });

      if (await hasConflict(resourceId, startTime, endTime)) {
        return res.status(400).json({ error: "Time slot conflicts with another appointment" });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ error: "User not found" });

      const title = `${user.firstName} ${user.lastName}`;

      const appointment = await prisma.appointment.create({
        data: {
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          title,
          resource: { connect: { id: resourceId } },
          user: { connect: { id: userId } },
          shop: { connect: { id: shopId } },
        },
        include: {
          resource: true,
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      await prisma.logs.create({
        data: {
          userId,
          shopId,
          type: LogType.APPOINTMENT_CREATED,
          to: JSON.stringify(appointment),
        },
      });

      res.json({ appointment });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "An error occurred" });
    }
  },
];
