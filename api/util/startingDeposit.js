import { LedgerItemType, LogType } from "#prisma-client";

export const createStartingDeposit = async ({
  prismaClient,
  userId,
  shopId,
  startingDeposit,
}) => {
  if (!(startingDeposit > 0)) {
    return;
  }

  const ledgerItem = await prismaClient.ledgerItem.create({
    data: {
      userId,
      shopId,
      value: startingDeposit,
      type: LedgerItemType.INITIAL,
    },
  });

  await prismaClient.logs.create({
    data: {
      userId,
      shopId,
      ledgerItemId: ledgerItem.id,
      type: LogType.LEDGER_ITEM_CREATED,
    },
  });
};
