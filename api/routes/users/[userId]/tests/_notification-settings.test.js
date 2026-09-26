import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "#index";
import { gt } from "#gt";
import { tc } from "#setup";
import { prisma } from "#prisma";

describe("/users/[userId]/notification-settings", () => {
  describe("GET", () => {
    it("returns defaults when no settings row exists yet", async () => {
      const res = await request(app)
        .get(`/api/users/${tc.user.id}/notification-settings`)
        .set(...(await gt()));

      expect(res.status).toBe(200);
      expect(res.body.settings).toBeDefined();
      expect(res.body.settings.emailJobCreated).toBe(true);
      expect(res.body.settings.emailCommentCreated).toBe(true);
      expect(res.body.settings.userId).toBe(tc.user.id);
    });

    it("returns persisted settings when a row already exists", async () => {
      await prisma.userNotificationSettings.create({
        data: {
          userId: tc.user.id,
          emailJobCreated: false,
          emailCommentCreated: true,
        },
      });

      const res = await request(app)
        .get(`/api/users/${tc.user.id}/notification-settings`)
        .set(...(await gt()));

      expect(res.status).toBe(200);
      expect(res.body.settings.emailJobCreated).toBe(false);
      expect(res.body.settings.emailCommentCreated).toBe(true);
    });

    it("returns 403 when a non-admin tries to access another user's settings", async () => {
      const res = await request(app)
        .get(`/api/users/${tc.targetUser.id}/notification-settings`)
        .set(...(await gt())); // tc.user is NOT an admin

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Forbidden/i);
    });

    it("allows a global admin to access another user's settings", async () => {
      const res = await request(app)
        .get(`/api/users/${tc.targetUser.id}/notification-settings`)
        .set(...(await gt({ ga: true })));

      expect(res.status).toBe(200);
      expect(res.body.settings.userId).toBe(tc.targetUser.id);
    });

    it("returns 401 when unauthenticated", async () => {
      const res = await request(app)
        .get(`/api/users/${tc.user.id}/notification-settings`);

      expect(res.status).toBe(401);
    });
  });

  describe("PUT", () => {
    it("creates settings when none exist yet", async () => {
      const res = await request(app)
        .put(`/api/users/${tc.user.id}/notification-settings`)
        .set(...(await gt()))
        .send({ emailJobCreated: false, emailCommentCreated: false });

      expect(res.status).toBe(200);
      expect(res.body.settings.emailJobCreated).toBe(false);
      expect(res.body.settings.emailCommentCreated).toBe(false);

      const dbRow = await prisma.userNotificationSettings.findUnique({
        where: { userId: tc.user.id },
      });
      expect(dbRow).toBeDefined();
      expect(dbRow.emailJobCreated).toBe(false);
      expect(dbRow.emailCommentCreated).toBe(false);
    });

    it("updates existing settings", async () => {
      await prisma.userNotificationSettings.create({
        data: {
          userId: tc.user.id,
          emailJobCreated: true,
          emailCommentCreated: true,
        },
      });

      const res = await request(app)
        .put(`/api/users/${tc.user.id}/notification-settings`)
        .set(...(await gt()))
        .send({ emailJobCreated: false, emailCommentCreated: true });

      expect(res.status).toBe(200);
      expect(res.body.settings.emailJobCreated).toBe(false);
      expect(res.body.settings.emailCommentCreated).toBe(true);

      const dbRow = await prisma.userNotificationSettings.findUnique({
        where: { userId: tc.user.id },
      });
      expect(dbRow.emailJobCreated).toBe(false);
      expect(dbRow.emailCommentCreated).toBe(true);
    });

    it("rejects invalid payload (non-boolean value)", async () => {
      const res = await request(app)
        .put(`/api/users/${tc.user.id}/notification-settings`)
        .set(...(await gt()))
        .send({ emailJobCreated: "yes", emailCommentCreated: true });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Invalid data");
    });

    it("rejects missing fields", async () => {
      const res = await request(app)
        .put(`/api/users/${tc.user.id}/notification-settings`)
        .set(...(await gt()))
        .send({ emailJobCreated: true });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Invalid data");
    });

    it("returns 403 when a non-admin modifies another user's settings", async () => {
      const res = await request(app)
        .put(`/api/users/${tc.targetUser.id}/notification-settings`)
        .set(...(await gt()))
        .send({ emailJobCreated: false, emailCommentCreated: false });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Forbidden/i);
    });

    it("allows a global admin to modify another user's settings", async () => {
      const res = await request(app)
        .put(`/api/users/${tc.targetUser.id}/notification-settings`)
        .set(...(await gt({ ga: true })))
        .send({ emailJobCreated: false, emailCommentCreated: false });

      expect(res.status).toBe(200);
      expect(res.body.settings.userId).toBe(tc.targetUser.id);
      expect(res.body.settings.emailJobCreated).toBe(false);
    });

    it("returns 401 when unauthenticated", async () => {
      const res = await request(app)
        .put(`/api/users/${tc.user.id}/notification-settings`)
        .send({ emailJobCreated: true, emailCommentCreated: true });

      expect(res.status).toBe(401);
    });
  });
});
