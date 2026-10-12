import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { LogType } from "#prisma-client";

export const post = [
  verifyAuth,
  async (req, res) => {
    const { shopId } = req.params;
    const { value: rawValue } = req.body;

    const value = parseFloat(rawValue);
    if (isNaN(value) || value < 0) {
      return res.status(400).json({ error: "Invalid value" });
    }

    const reqUserShop = await prisma.userShop.findFirst({
      where: { userId: req.user.id, shopId, active: true },
    });

    if (
      !reqUserShop ||
      !(
        req.user.admin ||
        reqUserShop.accountType === "ADMIN" ||
        reqUserShop.accountType === "OPERATOR"
      )
    ) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const userShops = await prisma.userShop.findMany({
      where: { shopId, active: true },
      select: { userId: true },
    });

    const toppedUp = [];
    const skipped = [];

    for (const { userId } of userShops) {
      const existingLedgerItems = await prisma.ledgerItem.findMany({
        where: { shopId, userId },
        select: { value: true },
      });
      const balance = existingLedgerItems.reduce(
        (acc, item) => acc + item.value,
        0
      );

      if (balance >= value) {
        skipped.push({ userId, balance });
        continue;
      }

      const valueToPost = value - balance;

      const ledgerItem = await prisma.ledgerItem.create({
        data: {
          shopId,
          userId,
          type: "MANUAL_TOPUP",
          value: valueToPost,
        },
      });

      await prisma.logs.create({
        data: {
          type: LogType.LEDGER_ITEM_CREATED_MANUALLY,
          userId,
          ledgerItemId: ledgerItem.id,
          shopId,
          to: JSON.stringify({
            postedBy: req.user.id,
            type: "MANUAL_TOPUP",
            value,
            bulk: true,
          }),
        },
      });

      toppedUp.push({ userId, amountAdded: valueToPost });
    }

    res.json({ toppedUp, skipped });
  },
];