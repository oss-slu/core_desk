import { expect, test, vi } from "vitest";
import { prisma } from "#mock-prisma";

vi.mock("#prisma");

const users = async () => {
  return await prisma.user.findMany();
};

test("createUser should return a user", async () => {
  const mockedUsers = {
    id: 1,
    firstName: "Alice",
  };

  prisma.user.findMany.mockResolvedValueOnce([mockedUsers]);

  const result = await users();

  expect(result).toEqual([mockedUsers]);
});
