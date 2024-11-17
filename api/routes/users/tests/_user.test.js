import { beforeEach, describe, expect, it, vi } from "vitest";
import { get } from "../index.js";
import request from "supertest";
import { app } from "../../../index.js";

describe("/users", () => {
  describe("GET", () => {
    it("Should return a list of users", async () => {
      const res = await request(app).get("/api/users").send();

      console.log(res.status);
      console.log(res.body);
    });
  });
});
