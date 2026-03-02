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
export const put = [
  verifyAuth,
  async (req, res) => {
    try {
      const { shopId, appointmentId } = req.params;
      const userId = req.user.id;
      const data = req.body;

      const appointment = await prisma.appointment.findFirst({
        where: { id: appointmentId, shopId },
        include: { user: true },
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

      const conflict = await hasConflict(
        appointment.resourceId,
        data.startTime,
        data.endTime,
        appointmentId
      )
      
      if (conflict) {
        return res.status(400).json({ error: "Time slot conflicts with another appointment" });
      }

      const updated = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
          resourceId: data.resourceId,
          title: `${appointment.user.firstName} ${appointment.user.lastName}`,
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
