
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";
import { verifyAuth, verifyAuthAlone } from "../verifyAuth.js";
import { prisma as mockPrisma } from "#mock-prisma";

vi.mock("jsonwebtoken");
vi.mock("../prisma.js", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

const app = express();
app.use(express.json());

app.get("/api/protected", verifyAuth, (req, res) => {
  res.status(200).json({ userId: req.user.id });
});

describe("verifyAuth middleware", () => {
  const mockUser = { id: "userid", suspended: false };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if no token is provided", async () => {
    const res = await request(app).get("/api/protected");

    expect(res.status).toBe(401);
  });

  it("returns 401 if token is invalid", async () => {
    jwt.verify.mockImplementation((token, secret, cb) => cb(new Error("Invalid token")));

    const res = await request(app)
      .get("/api/protected")
      .set("Authorization", "Bearer badtoken");

    expect(res.status).toBe(401);
  });

  it("returns 401 if user not found", async () => {
    jwt.verify.mockImplementation((token, secret, cb) => cb(null, { id: "userid" }));
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get("/api/protected")
      .set("Authorization", "Bearer validtoken");

    expect(res.status).toBe(401);
  });

  it("returns 403 if user is suspended and not accessing /api/auth/me", async () => {
    jwt.verify.mockImplementation((token, secret, cb) => cb(null, { id: "userid" }));
    mockPrisma.user.findUnique.mockResolvedValue({ id: "userid", suspended: true });

    const res = await request(app)
      .get("/api/protected")
      .set("Authorization", "Bearer validtoken");

    expect(res.status).toBe(403);
  });

  it("allows access if token is valid and user is active", async () => {
    jwt.verify.mockImplementation((token, secret, cb) => cb(null, { id: "userid" }));
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    const res = await request(app)
      .get("/api/protected")
      .set("Authorization", "Bearer validtoken");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ userId: "userid" });
  });
});

describe("verifyAuthAlone", () => {
  const mockUser = { id: "userid" };

  it("resolves with user if token is valid and user exists", async () => {
    jwt.verify.mockImplementation((token, secret, cb) => cb(null, { id: "userid" }));
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    const user = await verifyAuthAlone("Bearer goodtoken");
    expect(user).toEqual(mockUser);
  });

  it("rejects if user is not found", async () => {
    jwt.verify.mockImplementation((token, secret, cb) => cb(null, { id: "userid" }));
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(verifyAuthAlone("Bearer token")).rejects.toBe("User not found");
  });

  it("rejects if token is invalid", async () => {
    jwt.verify.mockImplementation((token, secret, cb) => cb(new Error("Invalid")));

    await expect(verifyAuthAlone("Bearer badtoken")).rejects.toBeInstanceOf(Error);
  });
});

