import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { app } from "#index";
import { gt } from "#gt";
import { tc } from "#setup";
import { prisma } from "#prisma";
import client from "#postmark";

vi.mock("#postmark", () => ({
  default: {
    sendEmail: vi.fn().mockResolvedValue({}),
  },
}));

describe("/shop/[shopId]/job/[jobId]/comments - notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET notifiableUsers", () => {
    it("returns notifiableUsers correctly", async () => {
      // Create a user who opts out
      const optOutUser = await prisma.user.create({
        data: {
          firstName: "Opt",
          lastName: "Out",
          email: "optout@example.com",
          notificationSettings: {
            create: {
              emailCommentCreated: false,
            },
          },
          shops: {
            create: {
              shopId: tc.shop.id,
              accountType: "OPERATOR",
              active: true,
            },
          },
        },
      });

      // Create a user who opts in
      const optInUser = await prisma.user.create({
        data: {
          firstName: "Opt",
          lastName: "In",
          email: "optin@example.com",
          notificationSettings: {
            create: {
              emailCommentCreated: true,
            },
          },
          shops: {
            create: {
              shopId: tc.shop.id,
              accountType: "ADMIN",
              active: true,
            },
          },
        },
      });

      const job = await prisma.job.create({
        data: {
          title: "Job for notifiableUsers test",
          shopId: tc.shop.id,
          userId: tc.user.id,
        },
      });

      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/job/${job.id}/comments`)
        .set(...(await gt()));

      expect(res.status).toBe(200);
      expect(res.body.notifiableUsers).toBeDefined();
      
      const notifiableIds = res.body.notifiableUsers.map(u => u.id);
      expect(notifiableIds).toContain(optOutUser.id);
      expect(notifiableIds).toContain(optInUser.id);
      
      const returnedOptOut = res.body.notifiableUsers.find(u => u.id === optOutUser.id);
      expect(returnedOptOut.emailCommentCreated).toBe(false);

      const returnedOptIn = res.body.notifiableUsers.find(u => u.id === optInUser.id);
      expect(returnedOptIn.emailCommentCreated).toBe(true);
    });
  });

  describe("POST notifications", () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    it("sends email to opted-in user", async () => {
      const optInUser = await prisma.user.create({
        data: {
          firstName: "Notify",
          lastName: "Me",
          email: "notify@example.com",
          notificationSettings: {
            create: {
              emailCommentCreated: true,
            },
          },
          shops: {
            create: {
              shopId: tc.shop.id,
              accountType: "OPERATOR",
              active: true,
            },
          },
        },
      });

      const job = await prisma.job.create({
        data: {
          title: "Job notify test",
          shopId: tc.shop.id,
          userId: tc.user.id,
        },
      });

      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/job/${job.id}/comments`)
        .set(...(await gt()))
        .send({
          message: "Testing normal notification",
          notifyUserIds: [optInUser.id],
        });

      expect(res.status).toBe(200);

      // Wait for fire-and-forget promise to resolve
      await sleep(100);

      expect(client.sendEmail).toHaveBeenCalledTimes(1);
      const emailArgs = client.sendEmail.mock.calls[0][0];
      expect(emailArgs.To).toBe("notify@example.com");
      expect(emailArgs.Subject).toContain("Comment created on job");
    });

    it("does not send email to opted-out user", async () => {
      const optOutUser = await prisma.user.create({
        data: {
          firstName: "Silent",
          lastName: "Bob",
          email: "silent@example.com",
          notificationSettings: {
            create: {
              emailCommentCreated: false,
            },
          },
          shops: {
            create: {
              shopId: tc.shop.id,
              accountType: "OPERATOR",
              active: true,
            },
          },
        },
      });

      const job = await prisma.job.create({
        data: {
          title: "Job silent test",
          shopId: tc.shop.id,
          userId: tc.user.id,
        },
      });

      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/job/${job.id}/comments`)
        .set(...(await gt()))
        .send({
          message: "Testing opt out",
          notifyUserIds: [optOutUser.id],
        });

      expect(res.status).toBe(200);

      await sleep(100);
      expect(client.sendEmail).not.toHaveBeenCalled();
    });

    it("sends email to opted-out user when adminOverride is true and sender is admin", async () => {
      // Ensure tc.user is an ADMIN in the shop to test override
      await prisma.userShop.updateMany({
        where: { userId: tc.user.id, shopId: tc.shop.id },
        data: { accountType: "ADMIN" },
      });

      const optOutUser = await prisma.user.create({
        data: {
          firstName: "Override",
          lastName: "Target",
          email: "override@example.com",
          notificationSettings: {
            create: {
              emailCommentCreated: false,
            },
          },
          shops: {
            create: {
              shopId: tc.shop.id,
              accountType: "OPERATOR",
              active: true,
            },
          },
        },
      });

      const job = await prisma.job.create({
        data: {
          title: "Job override test",
          shopId: tc.shop.id,
          userId: tc.user.id,
        },
      });

      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/job/${job.id}/comments`)
        .set(...(await gt()))
        .send({
          message: "Testing admin override",
          notifyUserIds: [optOutUser.id],
          adminOverride: true,
        });

      expect(res.status).toBe(200);

      await sleep(100);

      expect(client.sendEmail).toHaveBeenCalledTimes(1);
      const emailArgs = client.sendEmail.mock.calls[0][0];
      expect(emailArgs.To).toBe("override@example.com");
      expect(emailArgs.Subject).toContain("Urgent / Admin Notice");
      expect(emailArgs.HtmlBody).toContain("Administrator Notice:");
      expect(emailArgs.TextBody).toContain("[ADMINISTRATOR NOTICE]:");
    });
  });
});
