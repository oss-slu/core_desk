import { describe, expect, it} from "vitest";
import request from "supertest";
import { app } from "#index";
import { gt } from "#gt";
import { tc } from "#setup";

describe("/shop/[shopId]/job", () => {
    describe("POST", () => {
      it("Should create a job successfully with valid input", async () => {
        const res = await request(app)
          .post(`/api/shop/${tc.shop.id}/job`)
            .set(...(await gt()))
                .send({
                    jobId: "Job Id",
                    shopId: tc.shop.id,
                    dueDate: new Date()
                });
  
        expect(res.status).toBe(200); 
        expect(res.body.title).toBe(expect.any("String"));
        expect(res.body.dueDate).toBe(expect.any("String"));
            
      });
    });
});