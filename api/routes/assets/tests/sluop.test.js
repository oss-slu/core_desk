import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "#index";
import { gt } from "#gt";

describe("/asets/sluop", () => {
  describe("GET", () => {
    it("returns a PNG file", async () => {
      const res = await request(app)
        .get("/api/assets/sluop")
        .set(...(await gt({ ga: true })))
        .send();

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toBe("image/png");
    });

    it("returns a PNG file for unauthenticated users", async () => {
      const res = await request(app)
        .get("/api/assets/sluop")
        .set(...(await gt()))
        .send();

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toBe("image/png");
    });
  });
});
