// eslint-disable-next-line no-unused-vars
import { Prisma } from "@prisma/client";

/** @type {Prisma.ShopSelect} */
export const SHOP_SELECT = {
  id: true,
  name: true,
  address: true,
  phone: true,
  email: true,
  description: true,
  imageUrl: true,
  color: true,
  startingDeposit: true,
  logo: true,
  autoJoin: true,
};

/** @type {Prisma.ShopSelect} */
export const SHOP_SELECT_WITH_LEDGER = {
  ...SHOP_SELECT,
  ledgerItems: true,
};
