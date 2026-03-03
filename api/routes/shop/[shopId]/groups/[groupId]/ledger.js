import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { LogType } from "#prisma-client";

const getLedgerItems = async (shopId, groupId) =>
  prisma.ledgerItem.findMany({
    where: {
      shopId,
      billingGroupId: groupId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      job: {
        select: {
          title: true,
        },
      },
    },
  });

const getBalance = async (shopId, groupId) => {
  const balanceResult = await prisma.ledgerItem.aggregate({
    where: {
      shopId,
      billingGroupId: groupId,
    },
    _sum: {
      value: true,
    },
  });

  return balanceResult._sum.value || 0;
};

const requireGroupAccess = async (req) => {
  const { shopId, groupId } = req.params;

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

  const group = await prisma.billingGroup.findFirst({
    where: {
      id: groupId,
      shopId,
      active: true,
    },
  });

  if (!group) {
    return { error: { status: 404, body: { error: "Not found" } } };
  }

  const isStaff =
    req.user.admin ||
    reqUserShop.accountType === "ADMIN" ||
    reqUserShop.accountType === "OPERATOR";

  if (!isStaff) {
    const groupMembership = await prisma.userBillingGroup.findFirst({
      where: {
        userId: req.user.id,
        billingGroupId: groupId,
        active: true,
      },
    });

    if (!groupMembership) {
      return { error: { status: 403, body: { error: "Unauthorized" } } };
    }
  }

  return {
    shopId,
    groupId,
    isStaff,
  };
};

export const get = [
  verifyAuth,
  async (req, res) => {
    const access = await requireGroupAccess(req, res);
    if (access.error) {
      return res.status(access.error.status).json(access.error.body);
    }

    const { shopId, groupId } = access;
    const [ledgerItems, balance] = await Promise.all([
      getLedgerItems(shopId, groupId),
      getBalance(shopId, groupId),
    ]);

    return res.json({ ledgerItems, balance });
  },
];

export const post = [
  verifyAuth,
  async (req, res) => {
    const access = await requireGroupAccess(req, res);
    if (access.error) {
      return res.status(access.error.status).json(access.error.body);
    }

    if (!access.isStaff) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { shopId, groupId } = access;
    const { type, value: startValue } = req.body;

    let value = null;
    if (startValue !== undefined && startValue !== null) {
      value = parseFloat(startValue);
      if (isNaN(value)) {
        return res.status(400).json({ error: "value must be floaty" });
      }
    }

    if (value < 0) {
      return res.status(400).json({ error: "Invalid value" });
    }

    const existingLedgerItems = await prisma.ledgerItem.findMany({
      where: {
        shopId,
        billingGroupId: groupId,
      },
      select: {
        value: true,
      },
    });

    const balance = existingLedgerItems.reduce(
      (acc, item) => acc + item.value,
      0,
    );

    let valueToPost = 0;
    switch (type) {
      case "MANUAL_TOPUP":
        if (balance > value) {
          return res
            .status(400)
            .json({ error: "Balance is greater than topup" });
        }
        if (parseFloat(value) - balance === 0) {
          return res.status(400).json({ error: "Balance is unchanged" });
        }
        valueToPost = parseFloat(value) - balance;
        break;
      case "MANUAL_DEPOSIT":
      case "FUNDS_PURCHASED":
        valueToPost = parseFloat(value);
        break;
      case "MANUAL_REDUCTION":
        valueToPost = parseFloat(value) * -1;
        break;
      default:
        return res.status(400).json({ error: "Invalid type" });
    }

    const ledgerItem = await prisma.ledgerItem.create({
      data: {
        shopId,
        userId: null,
        billingGroupId: groupId,
        type,
        value: valueToPost,
      },
    });

    await prisma.logs.create({
      data: {
        type: LogType.LEDGER_ITEM_CREATED_MANUALLY,
        userId: req.user.id,
        billingGroupId: groupId,
        ledgerItemId: ledgerItem.id,
        shopId,
        to: JSON.stringify({
          postedBy: req.user.id,
          type,
          value,
          target: "BILLING_GROUP",
        }),
      },
    });

    const [ledgerItems, balanceAfter] = await Promise.all([
      getLedgerItems(shopId, groupId),
      getBalance(shopId, groupId),
    ]);

    return res.json({ ledgerItems, balance: balanceAfter });
  },
];
