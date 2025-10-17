import { LogType } from "@prisma/client";
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

export const post = [
  verifyAuth,
  async (req, res) => {
    try {
      const { shopId } = req.params;
      const userId = req.user.id;

      const userShop = await prisma.userShop.findFirst({
        where: { userId, shopId, active: true },
      });

      if (!userShop) return res.status(403).json({ error: "Unauthorized" });

      const { resourceId, jobId, startTime, endTime, notes } = req.body;

      const resource = await prisma.resource.findFirst({
        where: { id: resourceId, shopId, active: true },
      });

      if (!resource) return res.status(404).json({ error: "Resource not found" });

      if (await hasConflict(resourceId, startTime, endTime)) {
        return res.status(400).json({ error: "Time slot conflicts with another appointment" });
      }

      const appointment = await prisma.appointment.create({
        data: {
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          notes,
          resource: { connect: { id: resourceId } },
          job: jobId ? { connect: { id: jobId } } : undefined,
          user: { connect: { id: userId } },
          shop: { connect: { id: shopId } },
        },
        include: {
          resource: true,
          job: true,
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
        req.user.admin || userShop.accountType === "ADMIN" || userShop.accountType === "OPERATOR";

      const appointments = await prisma.appointment.findMany({
        where: {
          shopId,
          userId: isAdminOrOperator ? undefined : userId,
        },
        include: {
          resource: true,
          job: true,
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

export const put = [
  verifyAuth,
  async (req, res) => {
    try {
      const { shopId, appointmentId } = req.params;
      const userId = req.user.id;
      const data = req.body;

      const appointment = await prisma.appointment.findFirst({
        where: { id: appointmentId, shopId },
      });

      if (!appointment) return res.status(404).json({ error: "Appointment not found" });

      const userShop = await prisma.userShop.findFirst({
        where: { userId, shopId, active: true },
      });

      if (
        !req.user.admin &&
        !["ADMIN", "OPERATOR"].includes(userShop?.accountType) &&
        appointment.userId !== userId
      ) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      if (await hasConflict(appointment.resourceId, data.startTime, data.endTime, appointmentId)) {
        return res.status(400).json({ error: "Time slot conflicts with another appointment" });
      }

      const updated = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
          notes: data.notes,
          resourceId: data.resourceId,
        },
        include: {
          resource: true,
          job: true,
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      await prisma.logs.create({
        data: {
          userId,
          shopId,
          type: LogType.APPOINTMENT_MODIFIED,
          from: JSON.stringify(appointment),
          to: JSON.stringify(updated),
        },
      });

      res.json({ appointment: updated });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "An error occurred" });
    }
  },
];

export const del = [
  verifyAuth,
  async (req, res) => {
    try {
      const { shopId, appointmentId } = req.params;
      const userId = req.user.id;

      const appointment = await prisma.appointment.findFirst({
        where: { id: appointmentId, shopId },
      });

      if (!appointment) return res.status(404).json({ error: "Appointment not found" });

      const userShop = await prisma.userShop.findFirst({
        where: { userId, shopId, active: true },
      });

      if (
        !req.user.admin &&
        !["ADMIN", "OPERATOR"].includes(userShop?.accountType) &&
        appointment.userId !== userId
      ) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { active: false },
      });

      await prisma.logs.create({
        data: {
          userId,
          shopId,
          type: LogType.APPOINTMENT_MODIFIED,
          from: JSON.stringify(appointment),
          to: JSON.stringify({ ...appointment, active: false }),
        },
      });

      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "An error occurred" });
    }
  },
];
