import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../../index.js";
import { gt } from "#gt";
import { prisma } from "#mock-prisma";
import { prisma as realPrisma } from "#prisma";
import { LogType } from "@prisma/client";

describe("/users", () => {
  describe("GET", () => {
    it("Should return 403 if user is not a global admin", async () => {
      const res = await request(app)
        .get("/api/users")
        .set(...(await gt()))
        .send();

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });
      expect(prisma.user.findMany).not.toHaveBeenCalled();

      const requestingUser = await realPrisma.user.findUnique({
        where: { email: "test@email.com" },
        include: {
          logs: {
            where: {
              type: LogType.FORBIDDEN_ACTION,
            },
          },
        },
      });

      expect(requestingUser.logs).toHaveLength(1);
      expect(requestingUser.logs[0].type).toBe(LogType.FORBIDDEN_ACTION);
    });

    it("Should return a list of users if the user is a global admin", async () => {
      // Make the user a global admin
      await realPrisma.user.update({
        where: {
          email: "test@email.com",
        },
        data: {
          admin: true,
        },
      });

      const res = await request(app)
        .get("/api/users")
        .set(...(await gt()))
        .send();

      expect(res.status).toBe(200);
      expect(res.body.users).toHaveLength(1);

      expect(res.body.users[0]).toMatchObject({
        admin: expect.any(Boolean),
        createdAt: expect.any(String),
        email: expect.any(String),
        firstName: expect.any(String),
        id: expect.any(String),
        isMe: expect.any(Boolean),
        jobCount: expect.any(Number),
        lastName: expect.any(String),
        name: expect.any(String),
        shopCount: expect.any(Number),
        suspended: expect.any(Boolean),
        updatedAt: expect.any(String),
      });

      // Ensure no extra keys
      const expectedKeys = [
        "admin",
        "createdAt",
        "email",
        "firstName",
        "id",
        "isMe",
        "jobCount",
        "lastName",
        "name",
        "shopCount",
        "suspended",
        "suspensionReason",
        "updatedAt",
      ];
      expect(Object.keys(res.body.users[0]).sort()).toEqual(
        expectedKeys.sort()
      );

      expect(res.body).toMatchSnapshot({
        users: [
          {
            id: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
        ],
      });
    });
  });
});

describe("/jobs", () => {
  describe("POST", () => {
    it("Should create a job successfully with valid input", async () => {
      const jobData = {
        //Job Type (Valid Input Data)
      };

      const res = await request(app)
        .post("/api/jobs")
        .set(...(await gt()))
        .send(jobData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.title).toBe(jobData.title);
    });

    it("Should not create a duplicate job", async () => {
      const jobData = {
        //Job Type (Copy of Input Data)
      };

      // Create job initially
      await realPrisma.job.create({ data: jobData });

      const res = await request(app)
        .post("/api/jobs")
        .set(...(await gt()))
        .send(jobData);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Job already exists" });
    });
  });
});
