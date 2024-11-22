import { Prisma } from "@prisma/client";

export const SHOP_SELECT = {
  id: true,
  name: true,
  address: true,
  phone: true,
  email: true,
  description: true,
  imageUrl: true,
  color: true,
  logoUrl: true,
  startingDeposit: true,
};

/** @type {Prisma.ShopSelect} */
export const SHOP_SELECT_WITH_LEDGER = {
  ...SHOP_SELECT,
  ledgerItems: true,
};
