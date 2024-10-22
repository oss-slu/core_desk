import { prisma } from "../../../../../util/prisma.js";
import { verifyAuth } from "../../../../../util/verifyAuth.js";

export const get = [
  verifyAuth,
  async (req, res) => {
    const { shopId, jobId } = req.params;
    const userId = req.user.id;

    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        shopId,
        userId,
      },
      include: {
        items: true,
      },
    });

    if (!job) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.json({ job });
  },
];
