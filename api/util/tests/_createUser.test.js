import { describe, it, expect, vi, beforeEach } from "vitest";
import { createUser } from "../createUser";
import  prisma  from "#prisma"; // import the mocked prisma so we can configure it



vi.mock("#prisma", () => ({
  default: {
    user: {
      create: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    shop: {
      findMany: vi.fn(),
    },
    logs: {
      create: vi.fn(),
    },
    userShop: {
      create: vi.fn(),
    },
    ledgerItem: {
      create: vi.fn(),
    },
  },
}));

describe("createUser", () => {
  const mockUser = {
    id : "userid",
    email: "test@email.com",
    firstName: "First",
    lastName: "Last",
  };

  beforeEach(() => {
    vi.resetAllMocks();
    prisma.user.create.mockResolvedValue(mockUser);
    prisma.user.update.mockResolvedValue({ ...mockUser });
    prisma.logs.create.mockResolvedValue({});
    prisma.userShop.create.mockResolvedValue({});
    prisma.ledgerItem.create.mockResolvedValue({ id: "ledger-item-id" });
    prisma.shop.findMany.mockResolvedValue([]);
  });

  it("promotes first user to admin", async () => {
    prisma.user.update.mockResolvedValue({ ...mockUser, admin: true });
    prisma.user.count.mockResolvedValue(1);

    const user = await createUser(mockUser);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: user.id },
        data: expect.objectContaining({ admin: true }),
      })
    );
  });


  it("does not promote subsequent users to admin", async () => {
    prisma.user.count.mockResolvedValue(2);
    await createUser(mockUser);
    expect(prisma.user.update).not.toHaveBeenCalledWith();
  })

  it("deposits the starting balance for a user auto-joined to a shop", async () => {
    prisma.user.count.mockResolvedValue(2);
    prisma.shop.findMany.mockResolvedValue([
      { id: "shop-id", name: "Shop", startingDeposit: 100 },
    ]);

    await createUser(mockUser);

    expect(prisma.ledgerItem.create).toHaveBeenCalledWith({
      data: {
        userId: mockUser.id,
        shopId: "shop-id",
        value: 100,
        type: "INITIAL",
      },
    });
    expect(prisma.logs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: mockUser.id,
          shopId: "shop-id",
          ledgerItemId: "ledger-item-id",
        }),
      })
    );
  });
});


