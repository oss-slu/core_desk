import { describe, expect, it , vi, beforeEach, afterEach} from "vitest";
import { LogType } from "@prisma/client";
import request from "supertest";
import { app } from "#index";
import { gt } from "#gt";
import { tc } from "#setup";
import { prisma } from "#prisma";

describe("/shop/[shopId]/job", () => {
    describe("POST", () => {
        let findFirstSpy;
        let createLogsSpy;

        beforeEach(async () => {
            createLogsSpy = vi.spyOn(prisma.logs, "create");
            findFirstSpy = vi.spyOn(prisma.userShop, "findFirst");
        });

        afterEach(async () => {
            vi.restoreAllMocks();
        });
        
        it("allows job creation if a user exists on the shop"), async () => {
            prisma.userShop.findFirst = findFirstSpy.mockResolvedValue({
                userId: "example-id",
                shopId: tc.shop.id,
                active: true,
            });

            const res = await request(app)
                .post(`/api/shop/${tc.shop.id}/job`)
                .set(...(await gt({ ga: true })))
                .send({
                    title: "JobCreationExample Title",
                    description: "JobCreationExample description",
                    dueDate: new Date(),
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("job");
            expect(res.body.job).toMatchSnapshot({
                title: "JobCreationExample Title",
                description: "JobCreationExample description",
                shopId: expect.any(String),
                userId: expect.any(String),
                dueDate: expect.any(String),
            });
            
            expect(createLogsSpy).toHaveBeenCalledOnce();
            expect(createLogsSpy).toHaveBeenCalledWith(expect.objectContaining({
                type: LogType.JOB_CREATED,
                userId: expect.any(String),
                shopId: expect.any(String),
                jobId: expect.any(String),
            }));
        }

        it("denies job creation if a user doesn't exist on the shop"), async () => {
            prisma.userShop.findFirst = findFirstSpy.mockResolvedValue(null);

            const res = await request(app)
                .post(`/api/shop/${tc.shop.id}/job`)
                .set(...(await gt({ ga: true })))
                .send({
                    title: "JobCreationExample Title",
                    description: "JobCreationExample description",
                    dueDate: new Date(),
                });
            
            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Unauthorized")
            expect(createLogsSpy).not.toHaveBeenCalled();
        }
    })
})