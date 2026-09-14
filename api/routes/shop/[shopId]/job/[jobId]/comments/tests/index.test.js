import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "#index";
import { gt } from "#gt";
import { tc } from "#setup";
import { prisma } from "#prisma";
import { LogType } from "#prisma-client";

describe("/shop/[shopId]/job/[jobId]/comments", () => {
  describe("GET", () => {
    it("gets comments successfully", async () => {
      const job = await prisma.job.create({
        data: {
          title: "Job for get comments test",
          shopId: tc.shop.id,
          userId: tc.user.id,
        },
      });

      const firstComment = await prisma.jobComment.create({
        data: {
          message: "First comment",
          jobId: job.id,
          userId: tc.user.id,
          createdAt: new Date("2026-01-01T10:00:00Z"),
        },
      });

      const secondComment = await prisma.jobComment.create({
        data: {
          message: "Second comment",
          jobId: job.id,
          userId: tc.user.id,
          createdAt: new Date("2026-01-01T11:00:00Z"),
        },
      });

      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/job/${job.id}/comments`)
        .set(...(await gt()));

      expect(res.status).toBe(200);
      expect(res.body.comments).toHaveLength(2);
      expect(res.body.comments[0].id).toBe(secondComment.id);
      expect(res.body.comments[0].message).toBe("Second comment");
      expect(res.body.comments[0].user).toBeDefined();
      expect(res.body.comments[0].user.id).toBe(tc.user.id);
      expect(res.body.comments[1].id).toBe(firstComment.id);
      expect(res.body.comments[1].message).toBe("First comment");
    });

    it("rejects unauthorized shop", async () => {
      const job = await prisma.job.create({
        data: {
          title: "Job for shop auth test",
          shopId: tc.shop.id,
          userId: tc.user.id,
        },
      });

      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/job/${job.id}/comments`)
        .set(...(await gt({ user: tc.targetUser })));

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Shop not found");
    });

    it("rejects invalid job", async () => {
      // Non-existent job
      const notFoundRes = await request(app)
        .get(`/api/shop/${tc.shop.id}/job/non-existent-job-id/comments`)
        .set(...(await gt()));

      expect(notFoundRes.status).toBe(400);
      expect(notFoundRes.body.message).toBe("Job not found");

      // Job belonging to another shop
      const otherShop = await prisma.shop.create({
        data: {
          name: "Another Shop",
        },
      });

      const otherJob = await prisma.job.create({
        data: {
          title: "Job in other shop",
          shopId: otherShop.id,
          userId: tc.user.id,
        },
      });

      const crossShopRes = await request(app)
        .get(`/api/shop/${tc.shop.id}/job/${otherJob.id}/comments`)
        .set(...(await gt()));

      expect(crossShopRes.status).toBe(400);
      expect(crossShopRes.body.message).toBe("Job not found");
    });
  });

  describe("POST", () => {
    it("creates comment + log", async () => {
      const job = await prisma.job.create({
        data: {
          title: "Job for create comment test",
          shopId: tc.shop.id,
          userId: tc.user.id,
        },
      });

      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/job/${job.id}/comments`)
        .set(...(await gt()))
        .send({ message: "This is a new test comment" });

      expect(res.status).toBe(200);
      expect(res.body.comments).toBeDefined();
      expect(res.body.comments.length).toBeGreaterThanOrEqual(1);
      expect(res.body.comments[0].message).toBe("This is a new test comment");
      expect(res.body.comments[0].user.id).toBe(tc.user.id);

      const dbComment = await prisma.jobComment.findFirst({
        where: {
          jobId: job.id,
          message: "This is a new test comment",
        },
      });
      expect(dbComment).toBeDefined();
      expect(dbComment.userId).toBe(tc.user.id);
      expect(dbComment.jobId).toBe(job.id);

      const log = await prisma.logs.findFirst({
        where: {
          jobId: job.id,
          type: LogType.COMMENT_CREATED,
        },
      });
      expect(log).toBeDefined();
      expect(log.userId).toBe(tc.user.id);
      expect(log.shopId).toBe(tc.shop.id);
      expect(log.commentId).toBe(dbComment.id);
      expect(log.message).toBe("This is a new test comment");
    });

    it("uses authenticated user/route job", async () => {
      const job = await prisma.job.create({
        data: {
          title: "Target Route Job",
          shopId: tc.shop.id,
          userId: tc.user.id,
        },
      });

      const otherJob = await prisma.job.create({
        data: {
          title: "Injected Body Job",
          shopId: tc.shop.id,
          userId: tc.user.id,
        },
      });

      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/job/${job.id}/comments`)
        .set(...(await gt()))
        .send({
          message: "Testing parameter spoofing prevention",
          userId: tc.targetUser.id,
          jobId: otherJob.id,
        });

      expect(res.status).toBe(200);

      const dbComment = await prisma.jobComment.findFirst({
        where: {
          message: "Testing parameter spoofing prevention",
        },
      });
      expect(dbComment).toBeDefined();
      expect(dbComment.userId).toBe(tc.user.id);
      expect(dbComment.jobId).toBe(job.id);

      const log = await prisma.logs.findFirst({
        where: {
          commentId: dbComment.id,
        },
      });
      expect(log).toBeDefined();
      expect(log.userId).toBe(tc.user.id);
      expect(log.jobId).toBe(job.id);
    });

    it("rejects missing/invalid message", async () => {
      const job = await prisma.job.create({
        data: {
          title: "Job for invalid message test",
          shopId: tc.shop.id,
          userId: tc.user.id,
        },
      });

      // Missing message
      const missingRes = await request(app)
        .post(`/api/shop/${tc.shop.id}/job/${job.id}/comments`)
        .set(...(await gt()))
        .send({});

      expect(missingRes.status).toBe(400);
      expect(missingRes.body.error).toBe("Invalid data");
      expect(missingRes.body.issues.message).toBeDefined();

      // Empty message
      const emptyRes = await request(app)
        .post(`/api/shop/${tc.shop.id}/job/${job.id}/comments`)
        .set(...(await gt()))
        .send({ message: "" });

      expect(emptyRes.status).toBe(400);
      expect(emptyRes.body.error).toBe("Invalid data");

      // Whitespace-only message
      const whitespaceRes = await request(app)
        .post(`/api/shop/${tc.shop.id}/job/${job.id}/comments`)
        .set(...(await gt()))
        .send({ message: "   " });

      expect(whitespaceRes.status).toBe(400);
      expect(whitespaceRes.body.error).toBe("Invalid data");
    });

    it("rejects unauthorized shop", async () => {
      const job = await prisma.job.create({
        data: {
          title: "Job for unauthorized post test",
          shopId: tc.shop.id,
          userId: tc.user.id,
        },
      });

      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/job/${job.id}/comments`)
        .set(...(await gt({ user: tc.targetUser })))
        .send({ message: "Unauthorized comment attempt" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Shop not found");
    });

    it("rejects invalid job", async () => {
      // Non-existent job
      const notFoundRes = await request(app)
        .post(`/api/shop/${tc.shop.id}/job/non-existent-job-id/comments`)
        .set(...(await gt()))
        .send({ message: "Comment on non-existent job" });

      expect(notFoundRes.status).toBe(400);
      expect(notFoundRes.body.message).toBe("Job not found");

      // Job belonging to another shop
      const otherShop = await prisma.shop.create({
        data: {
          name: "Another Shop",
        },
      });

      const otherJob = await prisma.job.create({
        data: {
          title: "Job in another shop",
          shopId: otherShop.id,
          userId: tc.user.id,
        },
      });

      const crossShopRes = await request(app)
        .post(`/api/shop/${tc.shop.id}/job/${otherJob.id}/comments`)
        .set(...(await gt()))
        .send({ message: "Cross shop comment attempt" });

      expect(crossShopRes.status).toBe(400);
      expect(crossShopRes.body.message).toBe("Job not found");
    });
  });
});
