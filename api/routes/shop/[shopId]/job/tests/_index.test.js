import { describe, expect, it , vi, beforeEach, afterEach} from "vitest";
import { LogType } from "#prisma-client";
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
        
        it("allows job creation if a user exists on the shop", async () => {
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
            expect(res.body.job).toMatchObject({
                title: "JobCreationExample Title",
                description: "JobCreationExample description",
                shopId: expect.any(String),
                userId: expect.any(String),
                dueDate: expect.any(String),
            });
            
            expect(createLogsSpy).toHaveBeenCalledOnce();
            expect(createLogsSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                  data: expect.objectContaining({
                    type: LogType.JOB_CREATED,
                    user: { connect: { id: expect.any(String) } },
                    shop: { connect: { id: expect.any(String) } },
                    job: { connect: { id: expect.any(String) } },
                    to: expect.any(String), 
                  }),
                })  
            );    
        });

        it("denies job creation if a user doesn't exist on the shop", async () => {
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
        });

        it("allows job creation on behalf of billing group if user is a shop admin", async () => {
            prisma.userShop.findFirst = findFirstSpy.mockResolvedValue({
                userId: "example-id",
                shopId: tc.shop.id,
                active: true,
                role: "ADMIN",
            });

            const group = await prisma.billingGroup.create({
                data: {
                    shopId: tc.shop.id,
                    title: "Billing Group Test Group",
                }
            });

            const job = await prisma.job.create({
                data: {
                    title: "JobCreationExample Title",
                    dueDate: new Date(),
                    shopId: tc.shop.id,
                    userId: tc.user.id,
                    groupId: group.id,
                }
            });

            const res = await request(app)
                .post(`/api/shop/${tc.shop.id}/job`)
                .set(...(await gt({ ga: true })))
                .send(job);

            expect(res.status).toBe(200);
            expect(res.body.job.billingAccount.id).toBe(group.id);
        });
            
        it("defaults due date to two weeks out when dueDate is not provided", async () => {
            prisma.userShop.findFirst = findFirstSpy.mockResolvedValue({
                userId: "example-id",
                shopId: tc.shop.id,
                active: true,
            });

            const expectedDueDate = new Date();
            expectedDueDate.setDate(expectedDueDate.getDate() + 14);
            expectedDueDate.setHours(0, 0, 0, 0);

            const res = await request(app)
                .post(`/api/shop/${tc.shop.id}/job`)
                .set(...(await gt({ ga: true })))
                .send({
                    title: "Job with default due date",
                    description: "Missing due date should be defaulted",
                });

            expect(res.status).toBe(200);
            expect(new Date(res.body.job.dueDate).toISOString()).toBe(
                expectedDueDate.toISOString(),
            );
        });
    })
})
