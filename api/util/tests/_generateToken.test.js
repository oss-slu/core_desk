import { describe, expect, it, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import { prisma } from "#prisma";
import { gt } from "#gt";

vi.mock("#prisma", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    userShop: {
      updateMany: vi.fn(),
    },
  },
}));

describe("gt", () => {
  const mockUser = {
    id: "userid",
    email: "test@email.com",
    firstName: "First",
    lastName: "Last",
  };

  beforeEach(() => {
    prisma.user.findFirst.mockResolvedValue(mockUser);
    prisma.user.update.mockResolvedValue(mockUser);
    prisma.userShop.updateMany.mockResolvedValue({});
  });

  it("should return a Bearer token with default user", async () => {
    const [key, value] = await gt();

    expect(key).toBe("Authorization");
    expect(value).toMatch(/^Bearer\s[\w-]+\.[\w-]+\.[\w-]+$/);

    const token = value.split(" ")[1];
    const decoded = jwt.decode(token);

    expect(decoded).toMatchObject({
      id: mockUser.id,
      email: mockUser.email,
      firstName: mockUser.firstName,
      lastName: mockUser.lastName,
    });
  });

  it("should update user to admin if ga is true", async () => {
    await gt({ ga: true });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: mockUser.id },
      data: { admin: true },
    });
  });

  it("should update user to suspended if suspended is true", async () => {
    await gt({ suspended: true });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: mockUser.id },
      data: { suspended: true },
    });
  });

  it("should update user shop account type if sat is provided", async () => {
    await gt({ sat: "OWNER" });

    expect(prisma.userShop.updateMany).toHaveBeenCalledWith({
      where: { userId: mockUser.id },
      data: { accountType: "OWNER" },
    });
  });

  it("should use a provided user if passed in options", async () => {
    const customUser = {
      id: "userid",
      email: "test@email.com",
      firstName: "First",
      lastName: "Last",
    };

    const [_, value] = await gt({ user: customUser });
    const token = value.split(" ")[1];
    const decoded = jwt.decode(token);

    expect(decoded).toMatchObject({
      id: "userid",
      email: "test@email.com",
      firstName: "First",
      lastName: "Last",
    });
  });
});

