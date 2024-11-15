import { beforeEach, describe, expect, it, vi } from "vitest";
import { get } from "../index.js";
import { prisma } from "#mock-prisma";
vi.mock("#prisma");

describe("GET /users", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: { admin: true, id: "user-id" },
      query: { limit: "10", offset: "0" },
    };
    res = {
      status: vi.fn(() => res),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  it("should not allow a non-admin to read users", async () => {
    req.user.admin = false;

    await get[1](req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalled({ error: "Unauthorized" });
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });
});
