// eslint-disable-next-line no-unused-vars
import { PrismaClient } from "@prisma/client";
import { beforeEach } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";

// 2
beforeEach(() => {
  mockReset(prisma);
});

// 3
/** @type {PrismaClient} */
const prisma = mockDeep();
export { prisma };
export default prisma;
