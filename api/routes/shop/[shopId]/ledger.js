import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";

const toSumMap = (rows, key) =>
  Object.fromEntries(rows.map((row) => [row[key], row._sum.value || 0]));

const toCents = (value) =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

export const get = [
  verifyAuth,
  async (req, res) => {
    try {
      const { shopId } = req.params;

      const reqUserShop = await prisma.userShop.findFirst({
        where: {
          userId: req.user.id,
          shopId,
          active: true,
        },
      });

      if (!reqUserShop) {
        return res.status(404).json({ error: "Not found" });
      }

      const userIsStaff =
        req.user.admin ||
        reqUserShop.accountType === "ADMIN" ||
        reqUserShop.accountType === "OPERATOR";

      if (!userIsStaff) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const [
        shopUsers,
        groups,
        userBalanceRows,
        userPurchasedRows,
        groupBalanceRows,
        groupPurchasedRows,
      ] = await Promise.all([
        prisma.userShop.findMany({
          where: {
            shopId,
            active: true,
          },
          select: {
            userId: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        }),
        prisma.billingGroup.findMany({
          where: {
            shopId,
            active: true,
          },
          select: {
            id: true,
            title: true,
          },
        }),
        prisma.ledgerItem.groupBy({
          by: ["userId"],
          where: {
            shopId,
            userId: {
              not: null,
            },
          },
          _sum: {
            value: true,
          },
        }),
        prisma.ledgerItem.groupBy({
          by: ["userId"],
          where: {
            shopId,
            userId: {
              not: null,
            },
            type: "FUNDS_PURCHASED",
          },
          _sum: {
            value: true,
          },
        }),
        prisma.ledgerItem.groupBy({
          by: ["billingGroupId"],
          where: {
            shopId,
            billingGroupId: {
              not: null,
            },
          },
          _sum: {
            value: true,
          },
        }),
        prisma.ledgerItem.groupBy({
          by: ["billingGroupId"],
          where: {
            shopId,
            billingGroupId: {
              not: null,
            },
            type: "FUNDS_PURCHASED",
          },
          _sum: {
            value: true,
          },
        }),
      ]);

      const userBalanceMap = toSumMap(userBalanceRows, "userId");
      const userPurchasedMap = toSumMap(userPurchasedRows, "userId");
      const groupBalanceMap = toSumMap(groupBalanceRows, "billingGroupId");
      const groupPurchasedMap = toSumMap(groupPurchasedRows, "billingGroupId");

      const userRows = shopUsers
        .map((row) => {
          const balance = userBalanceMap[row.userId] || 0;
          const purchased = userPurchasedMap[row.userId] || 0;
          const debt = Math.max(0, balance * -1);
          const value = toCents(debt + purchased);

          return {
            payer: `${row.user.firstName} ${row.user.lastName}`.trim(),
            value,
          };
        })
        .filter((row) => row.value > 0);

      const groupRows = groups
        .map((group) => {
          const balance = groupBalanceMap[group.id] || 0;
          const purchased = groupPurchasedMap[group.id] || 0;
          const debt = Math.max(0, balance * -1);
          const value = toCents(debt + purchased);

          return {
            payer: group.title,
            value,
          };
        })
        .filter((row) => row.value > 0);

      const rows = [...userRows, ...groupRows].sort(
        (a, b) => b.value - a.value
      );

      return res.json({ rows });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Something went wrong" });
    }
  },
];
