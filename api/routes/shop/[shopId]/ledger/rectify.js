import { prisma } from "#prisma";
import { LogType } from "#prisma-client";
import { verifyAuth } from "#verifyAuth";

const getAccess = async (req) => {
  const { shopId } = req.params;
  const reqUserShop = await prisma.userShop.findFirst({
    where: {
      userId: req.user.id,
      shopId,
      active: true,
    },
  });

  if (!reqUserShop) {
    return { error: { status: 404, body: { error: "Not found" } } };
  }

  const userIsStaff =
    req.user.admin ||
    reqUserShop.accountType === "ADMIN" ||
    reqUserShop.accountType === "OPERATOR";

  if (!userIsStaff) {
    return { error: { status: 403, body: { error: "Unauthorized" } } };
  }

  return { shopId };
};

const sumItems = (items) =>
  items.reduce(
    (acc, item) => {
      acc.balance += item.value || 0;
      if (item.type === "FUNDS_PURCHASED") {
        acc.purchased += item.value || 0;
      }
      return acc;
    },
    { balance: 0, purchased: 0 }
  );

export const post = [
  verifyAuth,
  async (req, res) => {
    try {
      const access = await getAccess(req);
      if (access.error) {
        return res.status(access.error.status).json(access.error.body);
      }

      const { shopId } = access;
      const { targetType, targetId } = req.body || {};

      if (
        !targetId ||
        (targetType !== "USER" && targetType !== "GROUP")
      ) {
        return res.status(400).json({ error: "Invalid target" });
      }

      const where =
        targetType === "USER"
          ? { shopId, userId: targetId }
          : { shopId, billingGroupId: targetId };

      const existing = await prisma.ledgerItem.findMany({
        where,
        select: {
          value: true,
          type: true,
        },
      });

      if (!existing.length) {
        return res.status(404).json({ error: "Not found" });
      }

      const { balance, purchased } = sumItems(existing);
      const purchasedToRectify = Math.max(0, purchased);
      const balanceAfterPurchasedRectify = balance - purchasedToRectify;
      const depositToRectify = Math.max(0, balanceAfterPurchasedRectify * -1);

      const itemsToCreate = [];
      if (purchasedToRectify > 0) {
        itemsToCreate.push({
          type: "FUNDS_PURCHASED",
          value: purchasedToRectify * -1,
        });
      }
      if (depositToRectify > 0) {
        itemsToCreate.push({
          type: "MANUAL_DEPOSIT",
          value: depositToRectify,
        });
      }

      if (!itemsToCreate.length) {
        return res.json({ success: true, created: 0 });
      }

      const createdItems = await Promise.all(
        itemsToCreate.map((item) =>
          prisma.ledgerItem.create({
            data: {
              shopId,
              userId: targetType === "USER" ? targetId : null,
              billingGroupId: targetType === "GROUP" ? targetId : null,
              type: item.type,
              value: item.value,
            },
          })
        )
      );

      await prisma.logs.createMany({
        data: createdItems.map((item) => ({
          type: LogType.LEDGER_ITEM_CREATED_MANUALLY,
          userId: req.user.id,
          shopId,
          ledgerItemId: item.id,
          to: JSON.stringify({
            postedBy: req.user.id,
            targetType,
            targetId,
            source: "LEDGER_RECTIFY",
          }),
        })),
      });

      return res.json({ success: true, created: createdItems.length });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Something went wrong" });
    }
  },
];
